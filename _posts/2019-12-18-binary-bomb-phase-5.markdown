---
layout: post
title:  "Binary Bomb: Phase 5"
date:   2019-12-18 00:18:21
categories: reverse-engineering x86-64
tags: reverse-engineering binary-bomb gdb x86-64
excerpt: Phase 5 is a bit easier than Phase 4. We're back to having only one correct answer but in order to get that we're going to have to write some more Python code.
mathjax: false
---

# Note

Before diving into the phase_5 function, I want to point out a few lines we're going to ignore. They're not part of the challenge, but part of the application security placed by the compiler. As such, it's OK to ignore these lines without knowing what they're doing. Completing and understanding this phase doesn't require understanding them. If you're curious, search for "Stack Canary."

Here are the lines that will be ignored:

```
   0x000000000040106a <+8>:     mov    rax,QWORD PTR fs:0x28
   0x0000000000401073 <+17>:    mov    QWORD PTR [rsp+0x18],rax
   ...
   0x00000000004010d9 <+119>:   mov    rax,QWORD PTR [rsp+0x18]
   0x00000000004010de <+124>:   xor    rax,QWORD PTR fs:0x28
   ...
   0x00000000004010e9 <+135>:   call   0x400b30 <__stack_chk_fail@plt>
```
---

# Phase 5:

Phase 5 is a bit easier than Phase 4. We're back to having only one correct answer, but to get that we're going to have to write some code.

Go ahead and start gdb and set a breakpoint for explode_bomb. Once that's done, disassemble phase_5.

```
Dump of assembler code for function phase_5:
   0x0000000000401062 <+0>: 	push   rbx
   0x0000000000401063 <+1>: 	sub    rsp,0x20
   0x0000000000401067 <+5>: 	mov    rbx,rdi
   0x000000000040106a <+8>: 	mov    rax,QWORD PTR fs:0x28
   0x0000000000401073 <+17>:	mov    QWORD PTR [rsp+0x18],rax
   0x0000000000401078 <+22>:	xor    eax,eax
   0x000000000040107a <+24>:	call   0x40131b <string_length>
   0x000000000040107f <+29>:	cmp    eax,0x6
   0x0000000000401082 <+32>:	je     0x4010d2 <phase_5+112>
   0x0000000000401084 <+34>:	call   0x40143a <explode_bomb>
   0x0000000000401089 <+39>:	jmp    0x4010d2 <phase_5+112>
   0x000000000040108b <+41>:	movzx  ecx,BYTE PTR [rbx+rax*1]
   0x000000000040108f <+45>:	mov    BYTE PTR [rsp],cl
   0x0000000000401092 <+48>:	mov    rdx,QWORD PTR [rsp]
   0x0000000000401096 <+52>:	and    edx,0xf
   0x0000000000401099 <+55>:	movzx  edx,BYTE PTR [rdx+0x4024b0]
   0x00000000004010a0 <+62>:	mov    BYTE PTR [rsp+rax*1+0x10],dl
   0x00000000004010a4 <+66>:	add    rax,0x1
   0x00000000004010a8 <+70>:	cmp    rax,0x6
   0x00000000004010ac <+74>:	jne    0x40108b <phase_5+41>
   0x00000000004010ae <+76>:	mov    BYTE PTR [rsp+0x16],0x0
   0x00000000004010b3 <+81>:	mov    esi,0x40245e
   0x00000000004010b8 <+86>:	lea    rdi,[rsp+0x10]
   0x00000000004010bd <+91>:	call   0x401338 <strings_not_equal>
   0x00000000004010c2 <+96>:	test   eax,eax
   0x00000000004010c4 <+98>:	je     0x4010d9 <phase_5+119>
   0x00000000004010c6 <+100>:	call   0x40143a <explode_bomb>
   0x00000000004010cb <+105>:	nop    DWORD PTR [rax+rax*1+0x0]
   0x00000000004010d0 <+110>:	jmp    0x4010d9 <phase_5+119>
   0x00000000004010d2 <+112>:	mov    eax,0x0
   0x00000000004010d7 <+117>:	jmp    0x40108b <phase_5+41>
   0x00000000004010d9 <+119>:	mov    rax,QWORD PTR [rsp+0x18]
   0x00000000004010de <+124>:	xor    rax,QWORD PTR fs:0x28
   0x00000000004010e7 <+133>:	je     0x4010ee <phase_5+140>
   0x00000000004010e9 <+135>:	call   0x400b30 <__stack_chk_fail@plt>
   0x00000000004010ee <+140>:	add    rsp,0x20
   0x00000000004010f2 <+144>:	pop    rbx
   0x00000000004010f3 <+145>:	ret    
End of assembler dump.
```

Let's look at the first few lines of phase_5:

```
   0x0000000000401067 <+5>:     mov    rbx,rdi
   ...
   0x0000000000401078 <+22>:    xor    eax,eax
   0x000000000040107a <+24>:    call   0x40131b <string_length>
   0x000000000040107f <+29>:    cmp    eax,0x6
   0x0000000000401082 <+32>:	je     0x4010d2 <phase_5+112>
   0x0000000000401084 <+34>:	call   0x40143a <explode_bomb>
```

Here we can see space our input being assigned to RBX. The xor call is another way of setting the register to zero.

After zeroing out EAX, we see a function called string_length and immediately after returning from that function we compare EAX with 0x6. If EAX is 6, we jump further into the bomb, otherwise, we fall to explode_bomb.

It's safe to say we need to supply a string that's 6 characters long. Let's follow the jump and see if we can locate the string to be compared as we did in Phase 1.

```
   0x00000000004010d2 <+112>:   mov    eax,0x0
   0x00000000004010d7 <+117>:   jmp    0x40108b <phase_5+41>
   ...
   0x000000000040108b <+41>:    movzx  ecx,BYTE PTR [rbx+rax*1]
   0x000000000040108f <+45>:    mov    BYTE PTR [rsp],cl
   0x0000000000401092 <+48>:    mov    rdx,QWORD PTR [rsp]
   0x0000000000401096 <+52>:    and    edx,0xf
   0x0000000000401099 <+55>:    movzx  edx,BYTE PTR [rdx+0x4024b0]
```

After setting EAX to zero, the code jump again. There seems to be some reading and writing of registers.  The first line among these that seems interesting is:

```
   0x0000000000401099 <+55>:    movzx  edx,BYTE PTR [rdx+0x4024b0]
```

Whatever is at 0x4024b0 is being indexed by the value set in RDX. Let's examine that location.

```
x/s 0x4024b0
0x4024b0 <array.3449>:	"maduiersnfotvbylSo you think you can stop the bomb with ctrl-c, do you?"
```

It appears to be a C-string without a null terminator. If you look 1 line above, you'll see:

```
   0x0000000000401096 <+52>:    and    edx,0xf
```

EDX can only hold values between 0 and 15. The first 16 characters of 0x4024b0 are all lower case. We're going to eventually need those. Let's note them and continue:

```
maduiersnfotvbyl
```

Looking further down we can see that the above code is a loop that will be called six times, which is the length of our string.

```
   0x00000000004010a0 <+62>:    mov    BYTE PTR [rsp+rax*1+0x10],dl
   0x00000000004010a4 <+66>:    add    rax,0x1
   0x00000000004010a8 <+70>:    cmp    rax,0x6
   0x00000000004010ac <+74>:    jne    0x40108b <phase_5+41>
```

After exiting the loop we see another promising function, strings_not_equal.  This was the same function we saw in Phase 1. Our string should be right before the function call.

```
   0x00000000004010ae <+76>:    mov    BYTE PTR [rsp+0x16],0x0
   0x00000000004010b3 <+81>:    mov    esi,0x40245e
   0x00000000004010b8 <+86>:    lea    rdi,[rsp+0x10]
   0x00000000004010bd <+91>:    call   0x401338 <strings_not_equal>
   0x00000000004010c2 <+96>:    test   eax,eax
   0x00000000004010c4 <+98>:    je     0x4010d9 <phase_5+119>
   0x00000000004010c6 <+100>:   call   0x40143a <explode_bomb>
```

Let's examine 0x40245e:

```
x/s 0x40245e
0x40245e:	"flyers"
```

Let's try that string. Restart the bomb and enter the string we found.

Here we hit the explode_bomb breakpoint. The first string we found is too long and the second string just failed. Let's take a closer look.

Let's start with the loop in which we found the 16 character string. Set a breakpoint for 0x40108b and let's see what it's doing.

Stop the running session, and start it again. Use "flyers" once again at the input.

```
   0x000000000040108b <+41>:    movzx  ecx,BYTE PTR [rbx+rax*1]
   0x000000000040108f <+45>:    mov    BYTE PTR [rsp],cl
   0x0000000000401092 <+48>:    mov    rdx,QWORD PTR [rsp]
   0x0000000000401096 <+52>:    and    edx,0xf
   0x0000000000401099 <+55>:    movzx  edx,BYTE PTR [rdx+0x4024b0]
   0x00000000004010a0 <+62>:    mov    BYTE PTR [rsp+rax*1+0x10],dl
   0x00000000004010a4 <+66>:    add    rax,0x1
   0x00000000004010a8 <+70>:    cmp    rax,0x6
   0x00000000004010ac <+74>:    jne    0x40108b <phase_5+41>
```

The first line from above is taking the RBX register and offsetting it by the value stored in RAX. The RAX register was set to zero before entering this loop. The ECX will now contain the first letter of our input.

```
x/s $rbx
0x6038c0 <input_strings+320>:	"flyers"
```

The next line shows the lower 8 bits of the ECX register being moved onto the stack. Enter ni 2 into gdb to execute the next two instructions. This will put us at the third line and allow us to examine the stack.

```
x/c $rsp
0x7fffffffe430:	0x66
```

Open a new terminal window and type: showkey -a, then press the f key. To close showkey, press Ctrl-D.

```bash
$ showkey -a

Press any keys - Ctrl-D will terminate this program

f 	102 0146 0x66
^D 	  4 0004 0x04
```

Here we can see that f = 0x66. The next line sees that value being stored in RDX, and then anded with 0xf. The RDX register is now at 6.

Enter ni 2 again and we'll see the 16 character string being indexed by RDX, which is 6. The return value will be stored in EDX. The next line sees that value on the stack at RSP + 0x10. The storage locating changes as EAX changes. We can see in the following lines that this loop will take place 6 times.

It seems that our word is being encrypted and that maduiersnfotvbyl is the encryption key. The sixth letter in the key is r. 

Let's clear the breakpoint we set to stop execution at the beginning of this loop and set one for exiting the loop. You can get the list of breakpoints by typing info breakpoints or "i b" for short.

```
Num     Type           Disp Enb Address            What
1       breakpoint     keep y   0x000000000040143a <explode_bomb>
2       breakpoint     keep y   0x000000000040108b <phase_5+41>
```

The breakpoint we want to clear has an id of 2 on my computer. You might have a different value. Be careful not to remove the explode_bomb breakpoint!

```
del 2
```

Double checking that the correct breakpoint was removed:

```
Num     Type           Disp Enb Address            What
1       breakpoint     keep y   0x000000000040143a <explode_bomb>
```

Now set a breakpoint for 0x4010ae and run the bomb again, using "flyers" as the input.

The encrypted string was being stored at RSP + 0x10. Let's see what's there after the loop has terminated:

```
x/s $rsp+0x10
0x7fffffffe440:	"rvfedu"
```

There's the output. As expected, it starts with the letter r. Let's look closer to what happens with this encrypted string.

```
   0x00000000004010ae <+76>:    mov    BYTE PTR [rsp+0x16],0x0
   0x00000000004010b3 <+81>:    mov    esi,0x40245e
   0x00000000004010b8 <+86>:    lea    rdi,[rsp+0x10]
   0x00000000004010bd <+91>:    call   0x401338 <strings_not_equal>
```

The first line puts a null character at RSP + 0x16. This null terminates our string. Next, we see the unencrypted string, flyers moved into ESI, and the encrypted string, "rvfedu" moved into RDI. The strings are then compared.

To defuse this phase, we need to enter input that when encrypted, spells out "flyers." While this is easy enough to do by hand, it's also easy to write a program for.

```python
if __name__ == "__main__":
    unencrypted = "flyers"
    key = "maduiersnfotvbyl"
    
    print("Encrypted string: " , end='')

    for i in range(0,6):
        x = (ord(unencrypted[i]) - ord('a'))
        for j in range(0,16):
            if key[j] == unencrypted[i]:
                print(chr(ord('a') + j - 1) , end='')
                break

```

The above code has only been tested with Python 3.

Here's the output from the above code:

```
Encrypted string: ionefg
```

Restart the bomb and use ionefg as the input.

```
Welcome to my fiendish little bomb. You have 6 phases with
which to blow yourself up. Have a nice day!
Phase 1 defused. How about the next one?
That's number 2.  Keep going!
Halfway there!
So you got that one.  Try this one.
ionefg
Good work!  On to the next...
```

Don't forget to update your answer file.
