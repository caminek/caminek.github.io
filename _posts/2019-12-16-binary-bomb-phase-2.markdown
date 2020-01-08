---
layout: post
title:  "Binary Bomb: Phase 2"
date:   2019-12-16 15:36:41
categories: reverse-engineering x86-64
tags: reverse-engineering binary-bomb gdb x86-64
excerpt: Phase 2 is a little more difficult than Phase 1. In the first part of this document I go through solving the phase without gdb, and then in the second part, I solve it with gdb and a more in-depth explanation.
mathjax: false
---
Phase 2 is a little more difficult than Phase 1. In the first part of this document I go through solving the phase without gdb, and then in the second part, I solve it with gdb and a more in-depth explanation.

# Phase 2

Navigate to the directory in which you extracted the bomb from and start the gdb debugging session by typing the following:

```bash
gdb bomb
```

Set a breakpoint for explode_bomb:

```
b explode_bomb
```

Disassemble phase_2:

```
disas phase_2
```

We see there's a function named read_six_numbers. We could go through the function and study it, but we don't need to solve this challenge. Its enough to see the state of the registers and stack after the number has been run, or if we've entered the explode_bomb function. 

```
Dump of assembler code for function phase_2:
   0x0000000000400efc <+0>: 	push   rbp
   0x0000000000400efd <+1>: 	push   rbx
   0x0000000000400efe <+2>: 	sub    rsp,0x28
   0x0000000000400f02 <+6>: 	mov    rsi,rsp
   0x0000000000400f05 <+9>: 	call   0x40145c <read_six_numbers>
   0x0000000000400f0a <+14>:	cmp    DWORD PTR [rsp],0x1
   ...
```

Let's set our breakpoint for the address after read_six_numbers returns.

```
b *0x400f0a
```

Pass the answer file:


```
r answers.txt
```

Now enter the following 6 numbers:

```
7 8 9 4 5 6
```

Press Enter and you should now see we've stopped on the breakpoint we just set. Let's see what was placed on the stack:

```
x/6w $rsp
```
This means we want to examine 6 words starting at the stack pointer.

You should see:

```
0x7fffffffe440:	0x00000007	0x00000008	0x00000009	0x00000004
0x7fffffffe450:	0x00000005	0x00000006
```

Here's the instruction we stopped on.

```
   0x0000000000400f0a <+14>:	cmp    DWORD PTR [rsp],0x1
```

This instruction hasn't been executed. We can proceed, instruction by instruction from this point to see what will happen. In this line, we can see the address of the stack pointer will be dereferenced and compared to the number 0x1. Looking at our previous output, we can see the referenced number is 0x00000007. 

To execute the next instruction, type:

```
ni
```

In the background, the CMP instruction performs a subtraction. The result of this subtraction is not stored, but the status registers are affected. The CMP command subtracts the first number we entered, 7, from 0x1. Since 1 - 7 does not equal zero, the zero flag is not set. 

The following instruction only concerns itself with the status of the zero flag. The other flags that were set are not considered.

```
   0x0000000000400f0e <+18>:	je     0x400f30 <phase_2+52>
```

Instruction JE, means jump if equal. Since the zero flag was not set, this jump will not be taken.

Enter ni and see where we wind up.

```
   0x0000000000400f10 <+20>:	call   0x40143a <explode_bomb>
```

We now know that we must set that zero flag to proceed. if we changed out first number to 1, we could make it past this check. Let's restart and see what happens next.

Press Ctrl-C to exit the running session. You should still be inside of gdb. If you accidentally closed out of gdb, you'll need to start it back up and set your breakpoint for explode_bomb and the address after read_six_lines. If you didn't, you don't have to worry about resetting the breakpoints. They'll remain until you delete them or close out of gdb entirely.

If you'd like to verify that they're still there, enter:

```
info breakpoints
```

If you'd like to save a few keystrokes, you can also type:

```
i b
```

Run the bomb again. If you exited the bomb, you'll need to pass the answer file once again, otherwise you can just enter 'r' and gdb will read the answer file without needing to be told.

This time enter the following:

```
1 8 9 4 5 6
```

Execute the next instruction:

```
ni
```

We're now sitting on the jump, that we were unable to take last time. Execute the next instruction:

Now we see that we were able to take the jump. We know for certain that this number is correct. In the next three lines we see:

```
   0x0000000000400f30 <+52>:    lea    rbx,[rsp+0x4]
   0x0000000000400f35 <+57>:    lea    rbp,[rsp+0x18]
   0x0000000000400f3a <+62>:    jmp    0x400f17 <phase_2+27>
```

The LEA instruction, or Load Equivalent Address, is being used to calculate two different address. In C/C++ this would be pointer arithmetic. Let's see what the first line is doing:

```
x/w $rsp+4
```

Sure enough, the address of the second number is been placed into the RBX register. 

```
0x7fffffffe444:	0x00000008
```

As the numbers are stored in a contiguous block on the stack, and RBP has been assigned an address that's 0x18 or 24 bytes away from the first, we can deduce that this would be our last entered number. You can check this if you'd like in the same manner that we checked the what RBX was being set to.

Let's look at the next block of code:

```
   0x0000000000400f17 <+27>:    mov    eax,DWORD PTR [rbx-0x4]
   0x0000000000400f1a <+30>:    add    eax,eax
   0x0000000000400f1c <+32>:    cmp    DWORD PTR [rbx],eax
   0x0000000000400f1e <+34>:    je     0x400f25 <phase_2+41>
   0x0000000000400f20 <+36>:    call   0x40143a <explode_bomb>
   0x0000000000400f25 <+41>:    add    rbx,0x4
   0x0000000000400f29 <+45>:    cmp    rbx,rbp
   0x0000000000400f2c <+48>:    jne    0x400f17 <phase_2+27>
   0x0000000000400f2e <+50>:    jmp    0x400f3c <phase_2+64>
   ...
   0x0000000000400f3c <+64>:    add    rsp,0x28
   0x0000000000400f40 <+68>:    pop    rbx
   0x0000000000400f41 <+69>:    pop    rbp
   0x0000000000400f42 <+70>:    ret 
```

This is a for loop. If we look at the three jumps: one that allows us to jump over explode_bomb, one that puts us back at the top of this block, and one that jumps us out of Phase 2 entirely.

Let's look at the first three lines:

```
   0x0000000000400f17 <+27>:    mov    eax,DWORD PTR [rbx-0x4]
   0x0000000000400f1a <+30>:    add    eax,eax
   0x0000000000400f1c <+32>:    cmp    DWORD PTR [rbx],eax
```

Before jumping into this code block, RBX was set to the next number of our input. In our example, this would be the number 8. Now, we're dereferencing the address stored in RBX - 0x4 to access the previous number. In our example, this would be the number 1, and stores that into EAX.

Execute the MOV instruction. Now look at the value stored in EAX my entering the following:

```
x/w $eax
```

The next line adds EAX to itself stores the result back into EAX. Execute this instruction and then examine EAX. 

The third line compares what is stored in the address of RBX, which for us is 8, with the value that is stored in eax, which for us is 2. Because 2 - 8 != 0, the Zero flag will not be set. Once again, we end up calling explode_bomb.

To save time, lets imagine we had entered:

```
1 2 9 4 5 6
```

In this scenario, we would have pass the compare check since 2 - 2 = 0. Let's look to see if we can tell without gdb what would happen.

The JE instruction would have occured, which would have made the next instruction:

```
   0x0000000000400f25 <+41>:    add    rbx,0x4
```

We know that RBX contain the address of the second number in our array of integers. By adding 0x4 to RBX, we've now got a pointer to the third number in the array, which in this scenario is 9.

Next comparison is seeing if RBX and RBP are the same value.  This will only occur after we've gone through all six numbers. Since we've only gone through two, this condition won't be met and we jump back to the top of the code block.

```
   0x0000000000400f17 <+27>:    mov    eax,DWORD PTR [rbx-0x4]
   0x0000000000400f1a <+30>:    add    eax,eax
   0x0000000000400f1c <+32>:    cmp    DWORD PTR [rbx],eax
```

Again it will set EAX to the previous number, which is two. it will then add double the value in EAX and see if that doubled value equals 9, our third number.

Since we were forced to start with the number one, and we must have six number that must double each time, the only possible answer is:

```
1 2 4 8 16 32
```

# Cleaning up and testing

If you wanted to, you could restart the bomb with the numbers above, but you still have a breakpoint set. You could continue execution of the program by entering 'c', but if you happened to set a breakpoint in a loop, you'd hit it each time. You'd also hit the breakpoint every time you restarted the bomb, even if you're working on later phases. 

You should shut down and relaunch gdb which would clear all breakpoints, including explode_bomb. So if you were to do that, you'd have to reset that breakpoint before doing anything else. The easiest way to proceed is to delete or disable the breakpoint.

Enter 'i b' into gdb and you should see something similar.

```
Num     Type           Disp Enb Address            What
1       breakpoint     keep y   0x000000000040143a <explode_bomb>
2       breakpoint     keep y   0x0000000000400f0a <phase_2+14>
```

The numbers used to select which breakpoint you want to interact with. Here we see two breakpoints and their locations. We can also see they're both enabled. To temporarily disable a breakpoint, such as the one at address 0x400f0a, you'd use the disable command:

```
disable 2
```

Type 'i b' once again and you'll still see the breakpoint listed, but with an 'n' in the enabled column.

```
Num     Type           Disp Enb Address            What
1       breakpoint     keep y   0x000000000040143a <explode_bomb>
2       breakpoint     keep n   0x0000000000400f0a <phase_2+14>
```

Since we're not going to need this breakpoint again, we can go ahead and delete it with the delete command, or del for short.

```
del 2
```

Enter 'i b' one more time and you'll see it's now gone.

```
Num     Type           Disp Enb Address            What
1       breakpoint     keep y   0x000000000040143a <explode_bomb>
```

With the breakpoint deleted we can restart the bomb and test our answer:

```
Welcome to my fiendish little bomb. You have 6 phases with
which to blow yourself up. Have a nice day!
Phase 1 defused. How about the next one?
1 2 4 8 16 32
That's number 2.  Keep going!
```

That did it! Don't forget to save those numbers to your answer file.
