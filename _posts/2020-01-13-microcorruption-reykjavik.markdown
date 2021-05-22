---
layout: post
title:  "Microcorruption: Reykjavik"
date:   2020-01-13 06:59:34
categories: reverse-engineering ctf
tags: reverse-engineering ctf microcorruption
series: Microcorruption
excerpt: The program has been revised once again. Now we have "military-grade encryption" to contend with.
mathjax: false
---

From the manual:

> This is Software Revision 02. This release contains military-grade encryption so users can be confident that the passwords they enter can not be read from memory. We apologize for making it too easy for the password to be recovered on prior versions. The engineers responsible have been sacked.

Let's look at **main**:

```
4438 <main>
4438:  3e40 2045      mov	#0x4520, r14
443c:  0f4e           mov	r14, r15
443e:  3e40 f800      mov	#0xf8, r14
4442:  3f40 0024      mov	#0x2400, r15
4446:  b012 8644      call	#0x4486 <enc>
444a:  b012 0024      call	#0x2400
444e:  0f43           clr	r15
```

Here we have two functions, one named **enc** with is undoubtedly the encryption function and a function with no debugging symbols at address **2400**. I figured I'd start with **2400** since it comes after the encryption; meaning that the encryption function likely isn't performing the validation or unlocking.

To examine what's at **2400** we'll have to set a breakpoint for the address and step through the instructions. We get to just after **2440** before the password prompt appears.

```
2400:   0b12 0412 0441 2452 3150 e0ff 3b40 2045   .....A$R1P..;@ E
2410:   073c 1b53 8f11 0f12 0312 b012 6424 2152   .<.S........d$!R
2420:   6f4b 4f93 f623 3012 0a00 0312 b012 6424   oKO..#0.......d$
2430:   2152 3012 1f00 3f40 dcff 0f54 0f12 2312   !R0...?@...T..#.
2440:   b012 6424 3150 0600 b490 b7a0 dcff 0520   ..d$1P......... 
```

Let's disassemble the above with the **Assembler** option on the top menu.

```
0b12           push	r11
0412           push	r4
0441           mov	sp, r4
2452           add	#0x4, r4
3150 e0ff      add	#0xffe0, sp
3b40 2045      mov	#0x4520, r11
073c           jmp	$+0x10
1b53           inc	r11
8f11           sxt	r15
0f12           push	r15
0312           push	#0x0
b012 6424      call	#0x2464
2152           add	#0x4, sp
6f4b           mov.b	@r11, r15
4f93           tst.b	r15
f623           jnz	$-0x12
3012 0a00      push	#0xa
0312           push	#0x0
b012 6424      call	#0x2464
2152           add	#0x4, sp
3012 1f00      push	#0x1f
3f40 dcff      mov	#0xffdc, r15
0f54           add	r4, r15
0f12           push	r15
2312           push	#0x2
b012 6424      call	#0x2464
3150 0600      add	#0x6, sp
b490 b7a0 dcff cmp	#0xa0b7, -0x24(r4)
0520           jnz	$+0xc
```

On the second to last line, we see a comparison between **#0xa0b7** and **-0x24(r4)**.  Let's enter **b7a0** as our input. Reset the program and try the aforementioned input.  The door will now unlock. You can now solve this level.

When first completing this level, I had expected to find a comparison or a key within this function and that the password entered would be mutated by the **enc** function. It was a bit surprising to see the **enc** function could be bypassed entirely.
