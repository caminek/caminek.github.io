---
layout: post
title:  "Binary Bomb: Secret Phase"
date:   2019-12-20 13:34:27
categories: reverse-engineering x86-64
tags: reverse-engineering binary-bomb gdb x86-64
series: Binary Bomb Lab
excerpt: Unlike previous phases, we can't start by jumping directly into the secret_phase function. We first have to figure out how to get into the phase first.
mathjax: false
---

Unlike previous phases, we can't start by jumping directly into the secret_phase function. We first have to figure out how to get into the phase first.

---

# Finding the Secret Phase

We discovered back in Phase 0 that the path to the secret phase in through the phase_defused function that is called after completing every phase. Let's start there.

Start gdb and disassemble phase_defused:

```
Dump of assembler code for function phase_defused:
   0x4015c4 <+0>:	sub    rsp,0x78
   0x4015c8 <+4>:	mov    rax,QWORD PTR fs:0x28
   0x4015d1 <+13>:	mov    QWORD PTR [rsp+0x68],rax
   0x4015d6 <+18>:	xor    eax,eax
   0x4015d8 <+20>:	cmp    DWORD PTR [rip+0x202181],0x6  # 0x603760 <num_input_strings>
   0x4015df <+27>:	jne    0x40163f <phase_defused+123>
   0x4015e1 <+29>:	lea    r8,[rsp+0x10]
   0x4015e6 <+34>:	lea    rcx,[rsp+0xc]
   0x4015eb <+39>:	lea    rdx,[rsp+0x8]
   0x4015f0 <+44>:	mov    esi,0x402619
   0x4015f5 <+49>:	mov    edi,0x603870
   0x4015fa <+54>:	call   0x400bf0 <__isoc99_sscanf@plt>
   0x4015ff <+59>:	cmp    eax,0x3
   0x401602 <+62>:	jne    0x401635 <phase_defused+113>
   0x401604 <+64>:	mov    esi,0x402622
   0x401609 <+69>:	lea    rdi,[rsp+0x10]
   0x40160e <+74>:	call   0x401338 <strings_not_equal>
   0x401613 <+79>:	test   eax,eax
   0x401615 <+81>:	jne    0x401635 <phase_defused+113>
   0x401617 <+83>:	mov    edi,0x4024f8
   0x40161c <+88>:	call   0x400b10 <puts@plt>
   0x401621 <+93>:	mov    edi,0x402520
   0x401626 <+98>:	call   0x400b10 <puts@plt>
   0x40162b <+103>:	mov    eax,0x0
   0x401630 <+108>:	call   0x401242 <secret_phase>
   0x401635 <+113>:	mov    edi,0x402558
   0x40163a <+118>:	call   0x400b10 <puts@plt>
   0x40163f <+123>:	mov    rax,QWORD PTR [rsp+0x68]
   0x401644 <+128>:	xor    rax,QWORD PTR fs:0x28
   0x40164d <+137>:	je     0x401654 <phase_defused+144>
   0x40164f <+139>:	call   0x400b30 <__stack_chk_fail@plt>
   0x401654 <+144>:	add    rsp,0x78
   0x401658 <+148>:	ret    
End of assembler dump.
```

I removed 10 leading zeroes from the addresses above. The comment generated by the disassembler was wrapping around to the next line.

Let's look at that line and the following one:

```
   0x4015d8 <+20>:	cmp    DWORD PTR [rip+0x202181],0x6  # 0x603760 <num_input_strings>
   0x4015df <+27>:	jne    0x40163f <phase_defused+123>
```

This comparison is looking for 6 input strings, otherwise, it jumps over the most of the code. As there are six phases, it's likely this is a counter for phases solved. Let's assume it is and look further into the function.

Here are a few interesting lines. We see a call to sscanf. We know that the format string should be above the call, but there seem to be two values being prepared.

```
   0x4015f0 <+44>:	mov    esi,0x402619
   0x4015f5 <+49>:	mov    edi,0x603870
   0x4015fa <+54>:	call   0x400bf0 <__isoc99_sscanf@plt>
   0x4015ff  <+59>:      cmp    eax,0x3
   0x401602 <+62>:      jne    0x401635 <phase_defused+113>
```

Let's examine these addresses

```
x/s 0x402619
0x402619:	"%d %d %s"

x/s 0x603870
0x603870 <input_strings+240>:	""
```

It seems that the format string requires two digits and a string. The value that will be assigned to ESI is a null string. This will almost certainly be assigned by us at some point. If we don't provide the input in the expected format, we move towards the end of the function.

Just a few lines down there's a call to strings_not_equal. Let's look at what's being moved into the registers just beforehand.

```
   0x401604 <+64>:  mov    esi,0x402622
   0x401609 <+69>:  lea    rdi,[rsp+0x10]
   0x40160e <+74>:  call   0x401338 <strings_not_equal>
```

Let's examine 0x402622:

```
x/s 0x402622
0x402622:	"DrEvil"
```

That must be the string that sscanf was looking for. That means 0x603870 should eventually be assigned two digits. This means either Phase 3 or Phase 4 is where we gain access to the Secret Phase.

We could try breaking after each of the suspect phases and seeing if the value is at the location, but we don't know if it's cleared after use, after the phase, or at some other point.

The easiest way to get this is to set a watchpoint. A watchpoint is a conditional breakpoint. It only interrupts the execution of the code if the condition is met, where a breakpoint stops once a given address is reached.

Start gdb and set a breakpoint for explode_bomb. Next set a watchpoint for the constant value:

```
watch *0x603870
```

Run the bomb and pass the answer file. Once the watchpoint is triggered, examine 0x603870.

```
x/s 0x603870
0x603870 <input_strings+240>:	"3 0"
```

Phase 4 is our entry point. Remember, Phase 4 has multiple correct answers. Any of those correct answers will work here too. I'm seeing 3 0 because that's what I entered for that phase.

In order to access the Secret Phase, you'll need to affix DrEvil to the end of your answer. For example, I will change "3 0" to "3 0 DrEvil". Once you've done that, save your answer file.

Remove the watchpoint before restarting. Watchpoints can also be seen using info breakpoints or "i b" for short.

Once that's cleared, run the bomb again and you'll see:

```
Welcome to my fiendish little bomb. You have 6 phases with
which to blow yourself up. Have a nice day!
Phase 1 defused. How about the next one?
That's number 2.  Keep going!
Halfway there!
So you got that one.  Try this one.
Good work!  On to the next...
Curses, you've found the secret phase!
But finding it and solving it are quite different...
```

Press Ctrl-C to exit the running session. Now that we have access to the Secret Phase, we can start analyzing it.

---

# Secret Phase

We finally have access to the Secret Phase! Let's start by disassembling seecret_phase and see what's in it.

```
Dump of assembler code for function secret_phase:
   0x0000000000401242 <+0>: 	push   rbx
   0x0000000000401243 <+1>: 	call   0x40149e <read_line>
   0x0000000000401248 <+6>: 	mov    edx,0xa
   0x000000000040124d <+11>:	mov    esi,0x0
   0x0000000000401252 <+16>:	mov    rdi,rax
   0x0000000000401255 <+19>:	call   0x400bd0 <strtol@plt>
   0x000000000040125a <+24>:	mov    rbx,rax
   0x000000000040125d <+27>:	lea    eax,[rax-0x1]
   0x0000000000401260 <+30>:	cmp    eax,0x3e8
   0x0000000000401265 <+35>:	jbe    0x40126c <secret_phase+42>
   0x0000000000401267 <+37>:	call   0x40143a <explode_bomb>
   0x000000000040126c <+42>:	mov    esi,ebx
   0x000000000040126e <+44>:	mov    edi,0x6030f0
   0x0000000000401273 <+49>:	call   0x401204 <fun7>
   0x0000000000401278 <+54>:	cmp    eax,0x2
   0x000000000040127b <+57>:	je     0x401282 <secret_phase+64>
   0x000000000040127d <+59>:	call   0x40143a <explode_bomb>
   0x0000000000401282 <+64>:	mov    edi,0x402438
   0x0000000000401287 <+69>:	call   0x400b10 <puts@plt>
   0x000000000040128c <+74>:	call   0x4015c4 <phase_defused>
   0x0000000000401291 <+79>:	pop    rbx
   0x0000000000401292 <+80>:	ret    
End of assembler dump.
```

Here we see a function named read_line, which we've been using all along, but haven't seen in our disassembly.  Since this phase was hidden away from us, it was included here. If you go back to bomb.c, you'll see that read_line was what took our input and fed them into the phases. There's no need to look into that function.

The middle of the function contains the most interesting parts:

```
   0x000000000040125d <+27>:	lea    eax,[rax-0x1]
   0x0000000000401260 <+30>:	cmp    eax,0x3e8
   0x0000000000401265 <+35>:	jbe    0x40126c <secret_phase+42>
   0x0000000000401267 <+37>:	call   0x40143a <explode_bomb>
   0x000000000040126c <+42>:	mov    esi,ebx
   0x000000000040126e <+44>:	mov    edi,0x6030f0
   0x0000000000401273 <+49>:	call   0x401204 <fun7>
   0x0000000000401278 <+54>:	cmp    eax,0x2
   0x000000000040127b <+57>:	je     0x401282 <secret_phase+64>
   0x000000000040127d <+59>:	call   0x40143a <explode_bomb>
```

It appears our input is in EAX. We see EAX is decremented by 1 before being compared to 0x3e8 or decimal 1000. If EAX is below or equal to 1000, we jump over the call to explode_bomb. 

This means our input must be between 1 and 1001, due to the decrementation. The JBE instruction is an unsigned instruction, so it can't be used to compare negative numbers.

Next, we see an address being moved into EDI. let's see what's there:

```
x/s 0x6030f0
0x6030f0 <n1>:	"$"
```

Interesting result. I had examined the address as a string and got one back, but that was more than likely a fluke. I should have searched for a hex value. The value stored here just happened to match up with a printable ASCII character.

Also, we can see that there's also a name: n1

This is similar to what we saw in Phase 6.  There we had node1.  Let's increase our search to see if we have another data structure.

```
x/12x 0x6030f0
0x6030f0 <n1>:	0x000024	0x603110
0x603100 <n1+16>:	0x603130	0x000000
0x603110 <n21>:	0x000008	0x603190
0x603120 <n21+16>:	0x603150	0x000000
0x603130 <n22>:	0x000032	0x603170
0x603140 <n22+16>:	0x6031b0	0x000000
```

This looks like a BST, or binary search tree. Consider the first 4 quad word, or giant words:

```
x/4g 0x6030f0
0x6030f0 <n1>:	0x0000000000000024	0x0000000000603110
0x603100 <n1+16>:	0x0000000000603130	0x0000000000000000
```
The first giant word in the value stored in the node.  The second giant word in the address of the left child node.  The third giant word is the address of the right child node. The fourth giant word is unused space.

If you look at data stored at the left and right addresses, you'll see that an 0x8 and 0x32 come up respectively.


Let's look at the entire tree:

```
x/60x 0x6030f0
0x6030f0 <n1>:	0x000024	0x603110
0x603100 <n1+16>:	0x603130	0x000000
0x603110 <n21>:	0x000008	0x603190
0x603120 <n21+16>:	0x603150	0x000000
0x603130 <n22>:	0x000032	0x603170
0x603140 <n22+16>:	0x6031b0	0x000000
0x603150 <n32>:	0x000016	0x603270
0x603160 <n32+16>:	0x603230	0x000000
0x603170 <n33>:	0x00002d	0x6031d0
0x603180 <n33+16>:	0x603290	0x000000
0x603190 <n31>:	0x000006	0x6031f0
0x6031a0 <n31+16>:	0x603250	0x000000
0x6031b0 <n34>:	0x00006b	0x603210
0x6031c0 <n34+16>:	0x6032b0	0x000000
0x6031d0 <n45>:	0x000028	0x000000
0x6031e0 <n45+16>:	0x000000	0x000000
0x6031f0 <n41>:	0x000001	0x000000
0x603200 <n41+16>:	0x000000	0x000000
0x603210 <n47>:	0x000063	0x000000
0x603220 <n47+16>:	0x000000	0x000000
0x603230 <n44>:	0x000023	0x000000
0x603240 <n44+16>:	0x000000	0x000000
0x603250 <n42>:	0x000007	0x000000
0x603260 <n42+16>:	0x000000	0x000000
0x603270 <n43>:	0x000014	0x000000
0x603280 <n43+16>:	0x000000	0x000000
0x603290 <n46>:	0x00002f	0x000000
0x6032a0 <n46+16>:	0x000000	0x000000
0x6032b0 <n48>:	0x0003e9	0x000000
0x6032c0 <n48+16>:	0x000000	0x000000
```

While the data above will certainly be needed later, it's not in a very human-friendly format. I decided to create a graphic out of the data for easier reading.

<img src="/assets/img/binarybomb/secret_phase_bst.png" alt="Secret Phase BST" height="252" width="657" />

With the address of this BST in EDI, we call fun7. Before we jump into that function there's one more important piece of information to note. After returning from fun7 EAX is compared to 0x2. If it's not 2, the bomb is detonated. We need to be sure we arrive at 2 before exiting the function.

With that said, let's disassemble fun7:

```
Dump of assembler code for function fun7:
   0x401204 <+0>: 	sub    rsp,0x8                  // decrement sp
   0x401208 <+4>: 	test   rdi,rdi                  // rdi is node pointer
   0x40120b <+7>: 	je     0x401238 <fun7+52>       // jump if rdi = 0

   0x40120d <+9>: 	mov    edx,DWORD PTR [rdi]      // EDX = node value
   0x40120f <+11>:	cmp    edx,esi                  // is node <= input value?
   0x401211 <+13>:	jle    0x401220 <fun7+28>       // if yes, jump
   0x401213 <+15>:	mov    rdi,QWORD PTR [rdi+0x8]  // set node ptr to left child
   0x401217 <+19>:	call   0x401204 <fun7>          // recursive call

   0x40121c <+24>:	add    eax,eax                  // set eax=eax*2
   0x40121e <+26>:	jmp    0x40123d <fun7+57>       // jump to exit
   0x401220 <+28>:	mov    eax,0x0                  // EAX = 0
   0x401225 <+33>:	cmp    edx,esi                  // neither register has changed
   0x401227 <+35>:	je     0x40123d <fun7+57>       // jump

   0x401229 <+37>:	mov    rdi,QWORD PTR [rdi+0x10] // set node ptr to right child 
   0x40122d <+41>:	call   0x401204 <fun7>          // recursive call

   0x401232 <+46>:	lea    eax,[rax+rax*1+0x1]      // set rax=rax*2+1
   0x401236 <+50>:	jmp    0x40123d <fun7+57>       // jump over negative

   0x401238 <+52>:	mov    eax,0xffffffff               // set EAX negative
   0x40123d <+57>:	add    rsp,0x8                  // increment sp
   0x401241 <+61>:	ret                             // exit. EAX is cmp'd on return
End of assembler dump.
```

Since we're dealing with recursion again, I found it much easier to both solve and explain the inner workings of this function.

The value that EAX starts with depends on whether the input matches one of the tree node values or not. If the node matches, EAX will be 0. If the node does not match, EAX will be 0xffffffff. 

Placing a 2 in the EAX register is done by matching one node values and navigating our way back to the root node. The direction we move will affect the value in EAX.

Moving from a parent node to a left child node, the value of EAX will be EAX * 2.

Moving from a parent node to a right child node, the value of EAX will be EAX * 2 + 1.

Since 0 * 2 = 0, we'll need to be to the right of the parent node. This will set EAX to 1.

Now that we have a 1 in EAX, we'll need to double it by being to the left of the parent node. This will give us 1 * 2 = 2. This means that we cannot traverse the tree any further without going over. This node must be the root node.

So, from the root node, we must go left, and then right. Looking at the graphic, that gives us 0x16, or decimal 22.

As mentioned above, it is to the left of a parent after matching results in EAX = 0 * 2, or 0. This means you can also use 0x14, or decimal 20 as your answer since it is the left child of 0x16.

So, without further ado, clear all breakpoints except explode_bomb and run the bomb. Enter in either 20 or 22 and you'll see the following:


```
Welcome to my fiendish little bomb. You have 6 phases with
which to blow yourself up. Have a nice day!
Phase 1 defused. How about the next one?
That's number 2.  Keep going!
Halfway there!
So you got that one.  Try this one.
Good work!  On to the next...
Curses, you've found the secret phase!
But finding it and solving it are quite different...
22
Wow! You've defused the secret stage!
Congratulations! You've defused the bomb!
```

Save your answer to your answer file, and shut everything down. You're done!
