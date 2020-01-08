---
layout: post
title:  "Binary Bomb: Phase 3"
date:   2019-12-17 01:55:08
categories: reverse-engineering x86-64
tags: reverse-engineering binary-bomb gdb x86-64
excerpt: Phase 3 is a little more difficult than Phase 2 and in my opinion, the first interesting phase we've encountered. This phase is easy enough to pass without actually understanding what's going on and has multiple correct answers. Let's find out why.
mathjax: false
---

Phase 3 is a little more difficult than Phase 2 and in my opinion, the first interesting phase we've encountered. This phase is easy enough to pass without actually understanding what's going on and has multiple correct answers. Let's find out why.

# Phase 3

By now you should be comfortable starting gdb and setting a breakpoint for explode_bomb. If not, please refer back to Phase 1 or Phase 2.

With the breakpoint set on explode_bomb, disassemble phase_3.  You should see the following:

```
Dump of assembler code for function phase_3:
   0x0000000000400f43 <+0>: 	sub    rsp,0x18
   0x0000000000400f47 <+4>: 	lea    rcx,[rsp+0xc]
   0x0000000000400f4c <+9>: 	lea    rdx,[rsp+0x8]
   0x0000000000400f51 <+14>:	mov    esi,0x4025cf
   0x0000000000400f56 <+19>:	mov    eax,0x0
   0x0000000000400f5b <+24>:	call   0x400bf0 <__isoc99_sscanf@plt>
   0x0000000000400f60 <+29>:	cmp    eax,0x1
   0x0000000000400f63 <+32>:	jg     0x400f6a <phase_3+39>
   0x0000000000400f65 <+34>:	call   0x40143a <explode_bomb>
   0x0000000000400f6a <+39>:	cmp    DWORD PTR [rsp+0x8],0x7
   0x0000000000400f6f <+44>:	ja     0x400fad <phase_3+106>
   0x0000000000400f71 <+46>:	mov    eax,DWORD PTR [rsp+0x8]
   0x0000000000400f75 <+50>:	jmp    QWORD PTR [rax*8+0x402470]
   0x0000000000400f7c <+57>:	mov    eax,0xcf
   0x0000000000400f81 <+62>:	jmp    0x400fbe <phase_3+123>
   0x0000000000400f83 <+64>:	mov    eax,0x2c3
   0x0000000000400f88 <+69>:	jmp    0x400fbe <phase_3+123>
   0x0000000000400f8a <+71>:	mov    eax,0x100
   0x0000000000400f8f <+76>:	jmp    0x400fbe <phase_3+123>
   0x0000000000400f91 <+78>:	mov    eax,0x185
   0x0000000000400f96 <+83>:	jmp    0x400fbe <phase_3+123>
   0x0000000000400f98 <+85>:	mov    eax,0xce
   0x0000000000400f9d <+90>:	jmp    0x400fbe <phase_3+123>
   0x0000000000400f9f <+92>:	mov    eax,0x2aa
   0x0000000000400fa4 <+97>:	jmp    0x400fbe <phase_3+123>
   0x0000000000400fa6 <+99>:	mov    eax,0x147
   0x0000000000400fab <+104>:	jmp    0x400fbe <phase_3+123>
   0x0000000000400fad <+106>:	call   0x40143a <explode_bomb>
   0x0000000000400fb2 <+111>:	mov    eax,0x0
   0x0000000000400fb7 <+116>:	jmp    0x400fbe <phase_3+123>
   0x0000000000400fb9 <+118>:	mov    eax,0x137
   0x0000000000400fbe <+123>:	cmp    eax,DWORD PTR [rsp+0xc]
   0x0000000000400fc2 <+127>:	je     0x400fc9 <phase_3+134>
   0x0000000000400fc4 <+129>:	call   0x40143a <explode_bomb>
   0x0000000000400fc9 <+134>:	add    rsp,0x18
   0x0000000000400fcd <+138>:	ret    
End of assembler dump.
```

Unlike the previous phases, we don't have a custom function that tells us what input the bomb is expecting. We do however see a Standard I/O call, sscanf. 
```
   0x0000000000400f51 <+14>:	mov    esi,0x4025cf
   0x0000000000400f56 <+19>:	mov    eax,0x0
   0x0000000000400f5b <+24>:	call   0x400bf0 <__isoc99_sscanf@plt>
```

To use sscanf, you must pass it a format string. Right before the function call, we can see two registers being populated with data, ESI and EAX. Lets examine 0x4025cf.

```
x/s 0x4025cf
0x4025cf:	"%d %d"
```

This phase requires us to pass two numbers as input. Let's see what happens after sscanf gets this input.

```
   0x0000000000400f60 <+29>:    cmp    eax,0x1
   0x0000000000400f63 <+32>:    jg     0x400f6a <phase_3+39>
   0x0000000000400f65 <+34>:    call   0x40143a <explode_bomb>
   0x0000000000400f6a <+39>:    cmp    DWORD PTR [rsp+0x8],0x7
```

After returning from sscanf, we see that EAX is compared with 1. The sscanf function returns the number of matched fields. The only values we should see here are 0, 1, or 2.

The instruction JG or Jump if Greater makes two checks to determine whether or not to jump. To jump, the zero flag must not be set and the sign flag must equal the Overflow flag.

We've seen the zero flag set in the previous Phase. Zero is set when the values being compared are equal. The means that passing 1 number would cause the jump to fail and we'd call explode_bomb.

The CMP instruction sets a few other flags which we haven't needed up to this point. Two of those flags are the sign flag and the Overflow flag.

The sign flag is not set if the EAX greater than or equal to 0x1. So, if EAX is 0, CMP will subtract 1 from 0. Since the result is positive, the sign flag is not set. Since the comparison did not overflow, the overflow flag was not set. Since the result of the comparison was not 0, the zero flag was not set.

If the zero flag is set, or the sign flag does not equal the Overflow flag, then the jump would not be taken. Otherwise the jump is taken, and we avoid explode_bomb.

If we enter 2 numbers, we'll jump into the next instruction:
 
```
   0x0000000000400f6a <+39>:	cmp    DWORD PTR [rsp+0x8],0x7
```

This would appear to be reading something other than our numbers. I would expect our first number to be at [rsp] and the second number at [rsp+0x4]. This appears to be reading what I would expect to be the third number. 

Set a breakpoint for CMP above:

```
b *0x400f6a
```

Let's run the application to see what's going on.

```
r answers.txt
```

Enter in the following:
```
9 66
```

Let's examine the stack:

```
x/6w $rsp
```

Here we see:

```
0x7fffffffe460:	0x00000000	0x00000000	0x00000009	0x00000042
0x7fffffffe470:	0x00000000	0x00000000
```

For some reason, out input was not placed at RSP and RSP + 0x4, but at RSP + 0x8 and RSP + 0xc. Let's look at the CMP statement again.

```
   0x0000000000400f6a <+39>:    cmp    DWORD PTR [rsp+0x8],0x7
   0x0000000000400f6f <+44>:    ja     0x400fad <phase_3+106>
   ...
   0x0000000000400fad <+106>:   call   0x40143a <explode_bomb>
```

Here we can see that the first number is compared with 0x7. The jump instruction, JA is short for Jump if Above. In other words, if the first number is greater than 0x7, it will execute the jump instruction. As we can see, that instruction leads us to explode_bomb.

Now we know we need a number less than or equal to seven. Lets look a little further down the code to see if we can tell what we need out second number to be.

```
   0x0000000000400f71 <+46>:    mov    eax,DWORD PTR [rsp+0x8]
   0x0000000000400f75 <+50>:    jmp    QWORD PTR [rax*8+0x402470]
   0x0000000000400f7c <+57>:    mov    eax,0xcf
   0x0000000000400f81 <+62>:    jmp    0x400fbe <phase_3+123>
   0x0000000000400f83 <+64>:    mov    eax,0x2c3
   0x0000000000400f88 <+69>:    jmp    0x400fbe <phase_3+123>
   0x0000000000400f8a <+71>:    mov    eax,0x100
   ...
   0x0000000000400fb7 <+116>:   jmp    0x400fbe <phase_3+123>
   0x0000000000400fb9 <+118>:   mov    eax,0x137
```

The first jump appears to perform some calculation on an address using the first number we supplied followed by a bunch of jump statements. This looks very much like a switch statement. That means the address 0x402470 is our jump table.

To examine this table, we need to understand that a QWORD or Quad Word is 64-bits of data. For some reason gdb uses Giant Word instead of Quad Word.

```
x/8g 0x402470
```

This means we want to examine 8 giant words starting at address location 0x402470. Here's what we get for output:

```
0x402470:	0x0000000000400f7c	0x0000000000400fb9
0x402480:	0x0000000000400f83	0x0000000000400f8a
0x402490:	0x0000000000400f91	0x0000000000400f98
0x4024a0:	0x0000000000400f9f	0x0000000000400fa6
```

The jump table tells our program where to jump to based on our first number.  That number, 0 through 7 serves as an index.

Let's choose the number 3 to be our first number. Looking at the above table, we will jump 0x0000000000400f8a which is:

```
   0x0000000000400f8a <+71>:    mov    eax,0x100
   0x0000000000400f8f <+76>:    jmp    0x400fbe <phase_3+123>
   ...
   0x0000000000400fbe <+123>:   cmp    eax,DWORD PTR [rsp+0xc]
   0x0000000000400fc2 <+127>:   je     0x400fc9 <phase_3+134>
   0x0000000000400fc4 <+129>:   call   0x40143a <explode_bomb>
   0x0000000000400fc9 <+134>:   add    rsp,0x18
   0x0000000000400fcd <+138>:   ret    
```

Here we see 0x100, or 256 in base 10 is moved into EAX and then we jump unconditionally to a CMP instruction. It compares our second number to the value stored in EAX. If they match, we exit the phase successfully.

For this example, the correct input is:

```
3 256
```

Make sure you convert the second number from hex to decimal, otherwise it will be treated as a string, which will lead to the bomb exploding.

If you want, you use the jump table to select any other number between 0 through 7 and use the given address to find the correct second number.

Except for explode_bomb, clear your breakpoints and try your numbers. 

For this example, I'll use 3 256:

```
Welcome to my fiendish little bomb. You have 6 phases with
which to blow yourself up. Have a nice day!
Phase 1 defused. How about the next one?
That's number 2.  Keep going!
3 256
Halfway there!
```

Don't forget to save your answer to the answer file.
