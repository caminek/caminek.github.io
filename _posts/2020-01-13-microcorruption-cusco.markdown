---
layout: post
title:  "Microcorruption: Cusco"
date:   2020-01-13 06:14:28
categories: reverse-engineering ctf
tags: reverse-engineering ctf microcorruption
series: Microcorruption
excerpt: The conditional flag used in Hanoi is no longer part of the validation sequence.
mathjax: false
---

From the manual:

> This is Software Revision 02. We have improved the security of the lock by removing a conditional flag that could accidentally get set by passwords that were too long.

Let's look at **login** and see what has changed.

```
4500 <login>
4500:  3150 f0ff      add	#0xfff0, sp
4504:  3f40 7c44      mov	#0x447c "Enter the password to continue.", r15
4508:  b012 a645      call	#0x45a6 <puts>
450c:  3f40 9c44      mov	#0x449c "Remember: passwords are between 8 and 16 characters.", r15
4510:  b012 a645      call	#0x45a6 <puts>
4514:  3e40 3000      mov	#0x30, r14
4518:  0f41           mov	sp, r15
451a:  b012 9645      call	#0x4596 <getsn>
451e:  0f41           mov	sp, r15
4520:  b012 5244      call	#0x4452 <test_password_valid>
4524:  0f93           tst	r15
4526:  0524           jz	#0x4532 <login+0x32>
4528:  b012 4644      call	#0x4446 <unlock_door>
452c:  3f40 d144      mov	#0x44d1 "Access granted.", r15
4530:  023c           jmp	#0x4536 <login+0x36>
4532:  3f40 e144      mov	#0x44e1 "That password is not correct.", r15
4536:  b012 a645      call	#0x45a6 <puts>
453a:  3150 1000      add	#0x10, sp
453e:  3041           ret
```

These are the functions we saw in Hanoi. The same mystery app is still doing the validation, but according to the manual, there's no longer a conditional flag the will allow us access.  We'll likely need to use a buffer overflow once again.  Let's start the program and see what comes after our input.  Enter **AAAAAAAAAAAAAAAA** as your input and press **send**.

Let's examine memory.

```
43e0:   5645 0000 a045 0200 ee43 3000 1e45 4141   VE...E...C0..EAA
43f0:   4141 4141 4141 4141 4141 4141 4141 0044   AAAAAAAAAAAAAA.D
```

After our input, we see **0044** which is **4400** stored in little-endian format.  This looks like a location within the program. Let's see if it's a valid location.

```
4400 <__init_stack>
4400:  3140 0044      mov	#0x4400, sp
```

It is! This address must be a return value. We can overwrite this address with the address of the **unlock_door** function.

Reset the lock and use **414141414141414141414141414141412845** as your input. Remember to check the hex input box before pressing **send**. The door should now be unlocked. 

Enter **solve** into the debugger and submit the above password to complete the level.