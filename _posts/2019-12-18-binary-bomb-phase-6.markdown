---
layout: post
title:  "Binary Bomb: Phase 6"
date:   2019-12-18 19:27:56
categories: reverse-engineering x86-64
tags: reverse-engineering binary-bomb gdb x86-64
excerpt: This phase is the hardest yet. I spent longer trying to solve this phase than I did on all the other phases combined.
mathjax: false
---

# Phase 6

This phase is the hardest yet. I spent longer trying to solve this phase than I did on all the other phases combined.

To make both solving and explaining this phase easier, I've broken the phase into multiple stages. 

Stage 3 has a nested loop with two nested loops within it. Because of this, its entry point is not at the top of the stage like all the others, but three code blocks in. Don't worry, I marked it as such, but its something to keep an eye out for.

Most of the stages will have comments in the disassembly. I had tried to comment beneath the code, but as the blocks grew in size and complexity, the article became very long and impossible to follow along without significant scrolling.

---

# Stage 0: Disassembly

Start gdb, set your breakpoint for explode_bomb, and disassemble phase_6.

```
Dump of assembler code for function phase_6:
   0x00000000004010f4 <+0>: 	push   r14
   0x00000000004010f6 <+2>: 	push   r13
   0x00000000004010f8 <+4>: 	push   r12
   0x00000000004010fa <+6>: 	push   rbp
   0x00000000004010fb <+7>: 	push   rbx
   0x00000000004010fc <+8>: 	sub    rsp,0x50
   0x0000000000401100 <+12>:	mov    r13,rsp
   0x0000000000401103 <+15>:	mov    rsi,rsp
   0x0000000000401106 <+18>:	call   0x40145c <read_six_numbers>
   0x000000000040110b <+23>:	mov    r14,rsp
   0x000000000040110e <+26>:	mov    r12d,0x0
   0x0000000000401114 <+32>:	mov    rbp,r13
   0x0000000000401117 <+35>:	mov    eax,DWORD PTR [r13+0x0]
   0x000000000040111b <+39>:	sub    eax,0x1
   0x000000000040111e <+42>:	cmp    eax,0x5
   0x0000000000401121 <+45>:	jbe    0x401128 <phase_6+52>
   0x0000000000401123 <+47>:	call   0x40143a <explode_bomb>
   0x0000000000401128 <+52>:	add    r12d,0x1
   0x000000000040112c <+56>:	cmp    r12d,0x6
   0x0000000000401130 <+60>:	je     0x401153 <phase_6+95>
   0x0000000000401132 <+62>:	mov    ebx,r12d
   0x0000000000401135 <+65>:	movsxd rax,ebx
   0x0000000000401138 <+68>:	mov    eax,DWORD PTR [rsp+rax*4]
   0x000000000040113b <+71>:	cmp    DWORD PTR [rbp+0x0],eax
   0x000000000040113e <+74>:	jne    0x401145 <phase_6+81>
   0x0000000000401140 <+76>:	call   0x40143a <explode_bomb>
   0x0000000000401145 <+81>:	add    ebx,0x1
   0x0000000000401148 <+84>:	cmp    ebx,0x5
   0x000000000040114b <+87>:	jle    0x401135 <phase_6+65>
   0x000000000040114d <+89>:	add    r13,0x4
   0x0000000000401151 <+93>:	jmp    0x401114 <phase_6+32>
   0x0000000000401153 <+95>:	lea    rsi,[rsp+0x18]
   0x0000000000401158 <+100>:	mov    rax,r14
   0x000000000040115b <+103>:	mov    ecx,0x7
   0x0000000000401160 <+108>:	mov    edx,ecx
   0x0000000000401162 <+110>:	sub    edx,DWORD PTR [rax]
   0x0000000000401164 <+112>:	mov    DWORD PTR [rax],edx
   0x0000000000401166 <+114>:	add    rax,0x4
   0x000000000040116a <+118>:	cmp    rax,rsi
   0x000000000040116d <+121>:	jne    0x401160 <phase_6+108>
   0x000000000040116f <+123>:	mov    esi,0x0
   0x0000000000401174 <+128>:	jmp    0x401197 <phase_6+163>
   0x0000000000401176 <+130>:	mov    rdx,QWORD PTR [rdx+0x8]
   0x000000000040117a <+134>:	add    eax,0x1
   0x000000000040117d <+137>:	cmp    eax,ecx
   0x000000000040117f <+139>:	jne    0x401176 <phase_6+130>
   0x0000000000401181 <+141>:	jmp    0x401188 <phase_6+148>
   0x0000000000401183 <+143>:	mov    edx,0x6032d0
   0x0000000000401188 <+148>:	mov    QWORD PTR [rsp+rsi*2+0x20],rdx
   0x000000000040118d <+153>:	add    rsi,0x4
   0x0000000000401191 <+157>:	cmp    rsi,0x18
   0x0000000000401195 <+161>:	je     0x4011ab <phase_6+183>
   0x0000000000401197 <+163>:	mov    ecx,DWORD PTR [rsp+rsi*1]
   0x000000000040119a <+166>:	cmp    ecx,0x1
   0x000000000040119d <+169>:	jle    0x401183 <phase_6+143>
   0x000000000040119f <+171>:	mov    eax,0x1
   0x00000000004011a4 <+176>:	mov    edx,0x6032d0
   0x00000000004011a9 <+181>:	jmp    0x401176 <phase_6+130>
   0x00000000004011ab <+183>:	mov    rbx,QWORD PTR [rsp+0x20]
   0x00000000004011b0 <+188>:	lea    rax,[rsp+0x28]
   0x00000000004011b5 <+193>:	lea    rsi,[rsp+0x50]
   0x00000000004011ba <+198>:	mov    rcx,rbx
   0x00000000004011bd <+201>:	mov    rdx,QWORD PTR [rax]
   0x00000000004011c0 <+204>:	mov    QWORD PTR [rcx+0x8],rdx
   0x00000000004011c4 <+208>:	add    rax,0x8
   0x00000000004011c8 <+212>:	cmp    rax,rsi
   0x00000000004011cb <+215>:	je     0x4011d2 <phase_6+222>
   0x00000000004011cd <+217>:	mov    rcx,rdx
   0x00000000004011d0 <+220>:	jmp    0x4011bd <phase_6+201>
   0x00000000004011d2 <+222>:	mov    QWORD PTR [rdx+0x8],0x0
   0x00000000004011da <+230>:	mov    ebp,0x5
   0x00000000004011df <+235>:	mov    rax,QWORD PTR [rbx+0x8]
   0x00000000004011e3 <+239>:	mov    eax,DWORD PTR [rax]
   0x00000000004011e5 <+241>:	cmp    DWORD PTR [rbx],eax
   0x00000000004011e7 <+243>:	jge    0x4011ee <phase_6+250>
   0x00000000004011e9 <+245>:	call   0x40143a <explode_bomb>
   0x00000000004011ee <+250>:	mov    rbx,QWORD PTR [rbx+0x8]
   0x00000000004011f2 <+254>:	sub    ebp,0x1
   0x00000000004011f5 <+257>:	jne    0x4011df <phase_6+235>
   0x00000000004011f7 <+259>:	add    rsp,0x50
   0x00000000004011fb <+263>:	pop    rbx
   0x00000000004011fc <+264>:	pop    rbp
   0x00000000004011fd <+265>:	pop    r12
   0x00000000004011ff <+267>:	pop    r13
   0x0000000000401201 <+269>:	pop    r14
   0x0000000000401203 <+271>:	ret    
End of assembler dump.
```

---

# Stage 1: Validating input

There's certainly a whole lot more going on here than in the previous phases. Let's look at the beginning of the function:

```
   0x00000000004010f4 <+0>:     push   r14
   0x00000000004010f6 <+2>:     push   r13
   0x00000000004010f8 <+4>:     push   r12
   0x00000000004010fa <+6>:     push   rbp
   0x00000000004010fb <+7>:     push   rbx
   0x00000000004010fc <+8>:     sub    rsp,0x50
   0x0000000000401100 <+12>:    mov    r13,rsp
   0x0000000000401103 <+15>:    mov    rsi,rsp
   0x0000000000401106 <+18>:    call   0x40145c <read_six_numbers>
   0x000000000040110b <+23>:    mov    r14,rsp
   0x000000000040110e <+26>:    mov    r12d,0x0
   0x0000000000401114 <+32>:    mov    rbp,r13
```

Here we see that there's a call to the read_six_numbers function that we saw in Phase 2. So we know we'll need to provide six numbers as input.

The function starts by storing some register values, creating some room for us on the stack, placing our input onto the stack, and then calling read_six_numbers.

After returning from read_six_numbers, r14 is to the stack pointer as is the RBP. This leaves us with 4 registers pointing at the address in RSP: RSP, RBP, r13, 14.

Let's look at the next section of code:

```
   0x0000000000401117 <+35>:    mov    eax,DWORD PTR [r13+0x0]
   0x000000000040111b <+39>:    sub    eax,0x1
   0x000000000040111e <+42>:    cmp    eax,0x5
   0x0000000000401121 <+45>:    jbe    0x401128 <phase_6+52>
   0x0000000000401123 <+47>:    call   0x40143a <explode_bomb>
```

Here we see r13, which points at RSP, being indexed by 0 and dereferenced. The result is stored in EAX. Since our data was put on the stack, this will be the first number we've entered. We see that the number is decremented by 1 and then compared with 0x5. As long as the first number is not 6 or greater, we'll bypass the call to explode_bomb.

Now that we know how to bypass that block, let's look at the next block we would next jump to:

```
   0x0000000000401128 <+52>:    add    r12d,0x1
   0x000000000040112c <+56>:    cmp    r12d,0x6
   0x0000000000401130 <+60>:    je     0x401153 <phase_6+95>
   0x0000000000401132 <+62>:    mov    ebx,r12d
   0x0000000000401135 <+65>:    movsxd rax,ebx
   0x0000000000401138 <+68>:    mov    eax,DWORD PTR [rsp+rax*4]
   0x000000000040113b <+71>:    cmp    DWORD PTR [rbp+0x0],eax
   0x000000000040113e <+74>:    jne    0x401145 <phase_6+81>
   0x0000000000401140 <+76>:    call   0x40143a <explode_bomb>
```

Here we see 1 added to r12d, which is currently 0, and then compared with 0x6. If r12d is 6, the code branches out to another section.

The value of r12d is moved into EBX, and EBX is then moved into RAX.

Next, we see our input which is stored at RSP being indexed by rax, which is 1 multiplied by 4. This sets our second number into EAX. We then compare EAX to our first number. If they're equal, we fall into explode_bomb.

Let's check the next block:

```
   0x0000000000401145 <+81>:    add    ebx,0x1
   0x0000000000401148 <+84>:    cmp    ebx,0x5
   0x000000000040114b <+87>:    jle    0x401135 <phase_6+65>
```

Here we see loop back to the above block. This means that the first number must also be unique.

```
   0x000000000040114d <+89>:    add    r13,0x4
   0x0000000000401151 <+93>:    jmp    0x401114 <phase_6+32>
```

Here we see 0x4 being added to r13. The r13 register now points to the second number we entered. Next, we unconditionally jump up to 0x401114. Let's revisit that code:

```
   0x0000000000401114 <+32>:    mov    rbp,r13
   0x0000000000401117 <+35>:    mov    eax,DWORD PTR [r13+0x0]
   0x000000000040111b <+39>:    sub    eax,0x1
   0x000000000040111e <+42>:    cmp    eax,0x5
   0x0000000000401121 <+45>:    jbe    0x401128 <phase_6+52>
   0x0000000000401123 <+47>:    call   0x40143a <explode_bomb>
```

This was the code we saw earlier that limited the first number to 6 or less. This appears to be a condition for all numbers we enter.

These two loops are to ensure than no number is repeated and no number is greater than 6. Let's start gdb and test this hypothesis.

Start gdb and set a breakpoint for explode_bomb. We'll also need to set a breakpoint for the jump address that takes us out of these loops.

```
   0x0000000000401130 <+60>:    je     0x401153 <phase_6+95>
```

---

# Stage 2: Shuffling input

Set a breakpoint for 0x401153. Run the bomb and use the following as your input:

```
1 2 3 4 5 6
```

Let's look at our new loop to see what it does:

```
   0x0000000000401153 <+95>:    lea    rsi,[rsp+0x18]
   0x0000000000401158 <+100>:   mov    rax,r14
   0x000000000040115b <+103>:   mov    ecx,0x7
   0x0000000000401160 <+108>:   mov    edx,ecx
   0x0000000000401162 <+110>:   sub    edx,DWORD PTR [rax]
   0x0000000000401164 <+112>:   mov    DWORD PTR [rax],edx
   0x0000000000401166 <+114>:   add    rax,0x4
   0x000000000040116a <+118>:   cmp    rax,rsi
   0x000000000040116d <+121>:   jne    0x401160 <phase_6+108>
   0x000000000040116f <+123>:   mov    esi,0x0
   0x0000000000401174 <+128>:   jmp    0x401197 <phase_6+163>
```

Since we've run a few loops, our registers are now in a different state than when we last used them. It looks like we'll need to know what's in RSP+0x18 and r14.

```
x/w $rsp
0x7fffffffe3e0:	1

x/w $rsp+0x18
0x7fffffffe3f8:	0

x/w $r14
0x7fffffffe3e0:	1
```

Here we can see RSP and r14 both point to the top of the stack.

```
x/6w $rsp
0x7fffffffe3e0:	1	2	3	4
0x7fffffffe3f0:	5	6
```

We also see that our stack contains our input. Now we can work out what's happening in this loop.

The RSI register takes the address of RSP+0x18. Register RAX takes on the address of r14. The value 0x7 is moved into ECX and then EDX. 

The value stored in the address of RAX is subtracted from the value stored in EDX. The result is placed back into EDX.

The value at the address stored in RAX is now set to 6.

The address in RAX is incremented by 4, which is the address of the next value in our input. 

The addresses stored in RAX and RSI are compared. if they're not equal, the loop repeats. As with the other loops, this repeats 6 times.

The purpose of the function takes select nodes in a different order than what they were entered. While the nodes selected will be in the reverse order that they were entered, the code block does not *exclusively* reverse the order.

The reverse order occurred due to the numbers we chose. The formula altering the input is 7 - x where x is each number entered. For instance, had we chosen 3 6 1 2 4 5 as our input, the result would not have been 5 4 2 1 6 3, but 4 1 6 5 3 2.

---

# Stage 3: Loops

These blocks place the node addresses on the stack, starting at RSP+0x20.  Data is not transformed or reordered.

The entry point for this stage is in the third block below.

#### This block loops until we have the node we're looking for, which is stored in ecx

```
   0x0000000000401176 <+130>:   mov    rdx,QWORD PTR [rdx+0x8]         // node->next addr
   0x000000000040117a <+134>:   add    eax,0x1                         // set to 1 at <+171>
   0x000000000040117d <+137>:   cmp    eax,ecx                         // is EAX our node?
   0x000000000040117f <+139>:   jne    0x401176 <phase_6+130>          // no? loop until it is
   0x0000000000401181 <+141>:   jmp    0x401188 <phase_6+148>          // EAX == ecx
```

#### We found the node. It was placed into rdx. Copy node->next into stack.

```
   0x0000000000401183 <+143>:   mov    edx,0x6032d0                    // linked list addr
   0x0000000000401188 <+148>:   mov    QWORD PTR [rsp+rsi*2+0x20],rdx  // node->next addr
   0x000000000040118d <+153>:   add    rsi,0x4                         // node counter
   0x0000000000401191 <+157>:   cmp    rsi,0x18                        // 24/4 = 6 nodes max
   0x0000000000401195 <+161>:   je     0x4011ab <phase_6+183>          // exit condition
```

#### Select a node 

##### This is the entry point. We unconditionally jumped from Stage 2 at <+128>. The rsi register was set to 0x0 in Stage 2 at <+123>.

```
   0x0000000000401197 <+163>:   mov    ecx,DWORD PTR [rsp+rsi*1]       // get node number.
   0x000000000040119a <+166>:   cmp    ecx,0x1                         // ECX = 1
   0x000000000040119d <+169>:   jle    0x401183 <phase_6+143>          // if node1, jump
   0x000000000040119f <+171>:   mov    eax,0x1                         // EAX = 1
   0x00000000004011a4 <+176>:   mov    edx,0x6032d0                    // linked list addr
   0x00000000004011a9 <+181>:   jmp    0x401176 <phase_6+130>          // node2 and up
```

---

# Stage 4: Linking nodes

This section links the nodes together.

```
   0x00000000004011ab <+183>:   mov    rbx,QWORD PTR [rsp+0x20]  // start of Stage 3 addrs
   0x00000000004011b0 <+188>:   lea    rax,[rsp+0x28]            // second addr on stack
   0x00000000004011b5 <+193>:   lea    rsi,[rsp+0x50]            // terminating addr
   0x00000000004011ba <+198>:   mov    rcx,rbx                   // rcx = stack addr

   0x00000000004011bd <+201>:   mov    rdx,QWORD PTR [rax]       // rdx = node addr
   0x00000000004011c0 <+204>:   mov    QWORD PTR [rcx+0x8],rdx   // link nodes
   0x00000000004011c4 <+208>:   add    rax,0x8                   // next node
   0x00000000004011c8 <+212>:   cmp    rax,rsi                   // terminating node?
   0x00000000004011cb <+215>:   je     0x4011d2 <phase_6+222>    // yes? exit
   0x00000000004011cd <+217>:   mov    rcx,rdx                   // rcx = current node
   0x00000000004011d0 <+220>:   jmp    0x4011bd <phase_6+201>    // jump
```

---

# Stage 5: Sorting nodes

#### This stage checks to see if the nodes are sorted in descending order based on the value, not number stored within the node.

#### The rbx register holds the address of the first node in the list.

```
   0x00000000004011d2 <+222>:   mov    QWORD PTR [rdx+0x8],0x0  // set tail-> to 0x0 
   0x00000000004011da <+230>:   mov    ebp,0x5                  // ebp = 5

   0x00000000004011df <+235>:   mov    rax,QWORD PTR [rbx+0x8]  // node addr
   0x00000000004011e3 <+239>:   mov    eax,DWORD PTR [rax]      // value stored in node
   0x00000000004011e5 <+241>:   cmp    DWORD PTR [rbx],eax      // cmp node values
   0x00000000004011e7 <+243>:   jge    0x4011ee <phase_6+250>   // node x >= node x+1
   0x00000000004011e9 <+245>:   call   0x40143a <explode_bomb>  // Boom!

   0x00000000004011ee <+250>:   mov    rbx,QWORD PTR [rbx+0x8]  // rbx = 2nd node
   0x00000000004011f2 <+254>:   sub    ebp,0x1                  // decrement ebp
   0x00000000004011f5 <+257>:   jne    0x4011df <phase_6+235>   // ebp != 0
```

---

# Stage 6: Generating the answer

We now know that the nodes must be in descending order based on the value, not the number stored within the node. Let's look at the original linked list, which can be found at 0x6032d0.


| Node Number | Node Value | Node Size |
| ------------- | ------------- | ------------- |
|  1  |  0x14c  |  5 |
|  2  |   0xa8  |  6 |
|  3  |  0x39c  |  1 |
|  4  |  0x2b3  |  2 |
|  5  |  0x1dd  |  3 |
|  6  |  0x1bb  |  4 |

Here we see the correct order is 3 4 5 6 1 2, but in Stage 2 we saw our input in altered. We need to enter in six numbers, that once passed Stage 2 will become 3 4 5 6 1 2. The formula is 7 - x.

```
7 - 3 = 4
7 - 4 = 3
7 - 5 = 2
7 - 6 = 1
7 - 1 = 6
7 - 2 = 5
```

Clear all breakpoints, except explode_bomb and enter:

```
4 3 2 1 6 5
```

You should see:

```
Welcome to my fiendish little bomb. You have 6 phases with
which to blow yourself up. Have a nice day!
Phase 1 defused. How about the next one?
That's number 2.  Keep going!
Halfway there!
So you got that one.  Try this one.
Good work!  On to the next...
4 3 2 1 6 5
Congratulations! You've defused the bomb!
[Inferior 1 (process 168236) exited normally]
```

While we defused the bomb, we never found our way to the Secret Phase. Next article I'll cover that.

Don't forget to save your answer to the answer.txt file. We'll need to have all phases complete before we can access the Secret Phase.

