---
layout: post
title:  "Microcorruption: Sydney"
date:   2020-01-10 17:26:02
categories: reverse-engineering ctf
tags: reverse-engineering ctf microcorruption
series: Microcorruption
excerpt: The password is no longer stored within memory. We'll have to find another way in.
mathjax: false
---

From the manual:

> This is Software Revision 02. We have received reports that the prior version of the lock was bypassable without knowing the password. We have fixed this and removed the password from memory.

Let's look into the **main** function to see what has changed.

```
4438 <main>
4438:  3150 9cff      add	#0xff9c, sp
443c:  3f40 b444      mov	#0x44b4 "Enter the password to continue.", r15
4440:  b012 6645      call	#0x4566 <puts>
4444:  0f41           mov	sp, r15
4446:  b012 8044      call	#0x4480 <get_password>
444a:  0f41           mov	sp, r15
444c:  b012 8a44      call	#0x448a <check_password>
4450:  0f93           tst	r15
4452:  0520           jnz	#0x445e <main+0x26>
4454:  3f40 d444      mov	#0x44d4 "Invalid password; try again.", r15
4458:  b012 6645      call	#0x4566 <puts>
445c:  093c           jmp	#0x4470 <main+0x38>
445e:  3f40 f144      mov	#0x44f1 "Access Granted!", r15
4462:  b012 6645      call	#0x4566 <puts>
4466:  3012 7f00      push	#0x7f
446a:  b012 0245      call	#0x4502 <INT>
446e:  2153           incd	sp
4470:  0f43           clr	r15
4472:  3150 6400      add	#0x64, sp
```

We know from the last challenge that there's nothing for us within the **get_password** function. It displays the GUI that we use to enter in the password.

Let's look into the **check_password** function:

```
448a <check_password>
448a:  bf90 7325 0000 cmp	#0x2573, 0x0(r15)
4490:  0d20           jnz	$+0x1c
4492:  bf90 6e38 0200 cmp	#0x386e, 0x2(r15)
4498:  0920           jnz	$+0x14
449a:  bf90 2276 0400 cmp	#0x7622, 0x4(r15)
44a0:  0520           jne	#0x44ac <check_password+0x22>
44a2:  1e43           mov	#0x1, r14
44a4:  bf90 6c35 0600 cmp	#0x356c, 0x6(r15)
44aa:  0124           jeq	#0x44ae <check_password+0x24>
44ac:  0e43           clr	r14
44ae:  0f4e           mov	r14, r15
44b0:  3041           ret
```

Here we see that our input, which was stored in **r15** is being compared with hardcoded values every two bytes. The password was moved from memory and split up within the code.  Since the system is little-endian, we'll need to reverse the byte order.  

Enter **solve** into the debugger. When prompted, enter **73256e3822766c35** as your password. Make sure the hex input checkbox is checked, and press send. The door should now be unlocked.