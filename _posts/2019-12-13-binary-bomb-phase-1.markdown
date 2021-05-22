---
layout: post
title:  "Binary Bomb: Phase 1"
date:   2019-12-13 14:33:28
categories: reverse-engineering x86-64
tags: reverse-engineering binary-bomb gdb x86-64
series: Binary Bomb Lab
excerpt: The first thing we'll always want to do after launching gdb is to set a breakpoint on explode_bomb. A breakpoint stops the code from executing it is reached. If you make a mistake, this will prevent the bomb from exploding.
mathjax: false
---

Navigate to the directory in which you extracted the bomb from and start a gdb debugging session by typing the following:

```bash
gdb bomb
```

The first thing we'll always want to do after launching gdb is to set a breakpoint on explode_bomb. A breakpoint stops the code from executing it is reached. If you make a mistake, this will prevent the bomb from exploding.  We can simply restart our session or exit gdb. 

Set the breakpoint by typing the following:

```
b explode_bomb
```
The letter b is shorthand for breakpoint. With gdb, you only need to type enough of a command such that it is unique. You're welcome to use the full word or more letters if you choose. You can also press TAB to autocomplete a word.

You should now see a message that says:

```
Breakpoint 1 at 0x40143a
```

Now that its safe to play with the bomb, let's start by disassembling Phase 1. Start by typing:

``` 
disas phase_1
```

The disas command is shorthand for disassemble. The phase_1 argument is the function we want to disasssemble. We know this exists from both the bomb.c file and from objdump.

Below is the output:

```
Dump of assembler code for function phase_1:
   0x0000000000400ee0 <+0>: 	sub    rsp,0x8
   0x0000000000400ee4 <+4>: 	mov    esi,0x402400
   0x0000000000400ee9 <+9>: 	call   0x401338 <strings_not_equal>
   0x0000000000400eee <+14>:	test   eax,eax
   0x0000000000400ef0 <+16>:	je     0x400ef7 <phase_1+23>
   0x0000000000400ef2 <+18>:	call   0x40143a <explode_bomb>
   0x0000000000400ef7 <+23>:	add    rsp,0x8
   0x0000000000400efb <+27>:	ret    
End of assembler dump.
```

By its name, the function would appear to compare two strings and set a value into the EAX register based on whether that were equal or not. 

> Normally, we'd want to check to make sure the strings_not_equal function worked as we've assumed, or for that matter that explode_bomb does what it says. Given the nature of the assignment, I had opted to trust the named functions worked as expected. If I hadn't trusted them, I would have set a breakpoint for phase_1 and executed the instructions one-by-one, or at least disassembled the functions and reviewed them.

Right before the call to the strings_not_equal function, we see a mov instruction. Something is being moved into the ESI register. This is done to provide the function that is being called with the arguments it will need. Let's look to see what's at location 0x402400:

```
x/s 0x402400
0x402400:	"Border relations with Canada have never been better."
```

Here the 'x' stands for examine, and the 's' for string. We're telling gdb to examine 
0x402400 as a string. The output appears quite promising! Let's try submitting this string to the bomb and see what happens. Remember, if we accidentally enter the wrong information, we'll be protected by the breakpoint set for explode_bomb.

To start the bomb type run or simply the letter 'r' to run the bomb from within gdb. Do not run the bomb outside of gdb until all phases are solved!

Paste in the string from above, without the quotes and you should see:

```
Welcome to my fiendish little bomb. You have 6 phases with
which to blow yourself up. Have a nice day!
Border relations with Canada have never been better.
Phase 1 defused. How about the next one?
```

To exit the running bomb session you can either press Ctrl-C and then type quit, or you can exit the terminal.

# Answer file

This part is optional but highly recommended. This phase was the easiest of them all. The subsequent phases won't give up their secrets so easily. We'll need to enter random input just to see how the bomb processes it. From this, we'll attempt to work out what the correct response to the phase. This means we'll have to restart the bomb multiple times and enter the responses for the previous phases in the process. To make this easier, we can create a file with all of our correct answers for each phase and feed that into the bomb. This will save a lot of time and copy/pasting.

Create a text file and enter the string we just used to solve Phase 1. Make sure you press enter afterward or the bomb will detonate after reading the file. Save the file in the same directory as the bomb. I will refer to this file as answers.txt, though you're welcome to name the file whatever you want.
