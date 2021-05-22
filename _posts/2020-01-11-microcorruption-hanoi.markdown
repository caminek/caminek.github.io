---
layout: post
title:  "Microcorruption: Hanoi"
date:   2020-01-11 18:08:53
categories: reverse-engineering ctf
tags: reverse-engineering ctf microcorruption
series: Microcorruption
excerpt: The password is now validated by an external application. Since we don't have access to this application, we'll need to take a new approach to hack the lock.
mathjax: false
---

From the manual:

> LockIT Pro Hardware Security Module 1 stores the login password, ensuring users can not access the password through other means. The LockIT Pro can send the LockIT Pro HSM-1 a password, and the HSM will return if the password is correct by setting a flag in memory.

The locks have been changed once again. Now the password is stored within an app we don’t have access to. We’re told that if the correct password is entered into the app and if correct a flag will be set allowing entry.

The password prompt reminds us that the password must be between 8 - 16 characters in length. While that might be the intent of the developer, it might be susceptible to a buffer overflow attack.  Let's see what we have to work with.

The following was entered into a Python REPL to generate our password string. This should show us how long our input can be.

```
>>> import string
>>> string.ascii_letters
'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
```

Use **abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ** as your password and press **send**.  You should see the password string starting at memory location **2400**.  The last character of the password in memory is **B**.  This means we've got 28 characters that will be accepted. We now know for certain that we can overflow the buffer.

Let's take a look at the **main** function:

```
4438 <main>
4438:  b012 2045      call	#0x4520 <login>
443c:  0f43           clr	r15
```

Not much going on there. Looks like everything happens within **login** now.  Let's take a look at that:

```
4520 <login>
4520:  c243 1024      mov.b	#0x0, &0x2410
4524:  3f40 7e44      mov	#0x447e "Enter the password to continue.", r15
4528:  b012 de45      call	#0x45de <puts>
452c:  3f40 9e44      mov	#0x449e "Remember: passwords are between 8 and 16 characters.", r15
4530:  b012 de45      call	#0x45de <puts>
4534:  3e40 1c00      mov	#0x1c, r14
4538:  3f40 0024      mov	#0x2400, r15
453c:  b012 ce45      call	#0x45ce <getsn>
4540:  3f40 0024      mov	#0x2400, r15
4544:  b012 5444      call	#0x4454 <test_password_valid>
4548:  0f93           tst	r15
454a:  0324           jz	$+0x8
454c:  f240 4900 1024 mov.b	#0x49, &0x2410
4552:  3f40 d344      mov	#0x44d3 "Testing if password is valid.", r15
4556:  b012 de45      call	#0x45de <puts>
455a:  f290 7d00 1024 cmp.b	#0x7d, &0x2410
4560:  0720           jne	#0x4570 <login+0x50>
4562:  3f40 f144      mov	#0x44f1 "Access granted.", r15
4566:  b012 de45      call	#0x45de <puts>
456a:  b012 4844      call	#0x4448 <unlock_door>
456e:  3041           ret
4570:  3f40 0145      mov	#0x4501 "That password is not correct.", r15
4574:  b012 de45      call	#0x45de <puts>
4578:  3041           ret
```

We have two interesting functions here, **test_password_valid** and **unlock_door**. According to the manual shown at the start of the level, we need a flag to be set before unlocking the door.

Let's look at **test_password_valid**:

```
4454 <test_password_valid>
4454:  0412           push	r4
4456:  0441           mov	sp, r4
4458:  2453           incd	r4
445a:  2183           decd	sp
445c:  c443 fcff      mov.b	#0x0, -0x4(r4)
4460:  3e40 fcff      mov	#0xfffc, r14
4464:  0e54           add	r4, r14
4466:  0e12           push	r14
4468:  0f12           push	r15
446a:  3012 7d00      push	#0x7d
446e:  b012 7a45      call	#0x457a <INT>
4472:  5f44 fcff      mov.b	-0x4(r4), r15
4476:  8f11           sxt	r15
4478:  3152           add	#0x8, sp
447a:  3441           pop	r4
447c:  3041           ret
```

There are two registers and an unknown value being pushed to the stack before calling **INT**.

From the Lock Manual:

>The Model 1 of the hardware security module contains a simple interface which allows the MCU to test if an entered password is valid. By default, the interrupt 0x7D will pass a given password to the HSM, and will set a byte in memory if the password entered matches the stored password.

Since this is set by the application we don't have access to, set see what happens after we exit this function. Something must be looking for **0x7d** somewhere within memory.

Here's **login** right after we exit from **test_password_valid**:

```
4544:  b012 5444      call	#0x4454 <test_password_valid>
4548:  0f93           tst	r15
454a:  0324           jz	$+0x8
454c:  f240 4900 1024 mov.b	#0x49, &0x2410
4552:  3f40 d344      mov	#0x44d3 "Testing if password is valid.", r15
4556:  b012 de45      call	#0x45de <puts>
455a:  f290 7d00 1024 cmp.b	#0x7d, &0x2410
4560:  0720           jne	#0x4570 <login+0x50>
4562:  3f40 f144      mov	#0x44f1 "Access granted.", r15
4566:  b012 de45      call	#0x45de <puts>
456a:  b012 4844      call	#0x4448 <unlock_door>
```

If **r15** is zero we jump to a string that is then displayed on the screen. We then see the memory location **2410** is compared to **0x7d**, our valid password flag. If that flag is found we’re told we have access and then the **unlock_door** function is called.


The address **2410** is immediately after our password. We need the 17th byte of the password to be **7d**.  The first 16 can be any printable. I've chosen to use **41** which is A.

Reset the machine and enter **414141414141414141414141414141417d** as your password.  Make certain that the box for hex input is checked and press **send**. The door should now be unlocked.

Enter solve into the debugger and submit the above password to complete the level.
