---
layout: post
title:  "Binary Bomb: Phase 0"
date:   2019-12-12 21:14:54
categories: reverse-engineering x86-64
tags: reverse-engineering binary-bomb objdump x86-64
series: Binary Bomb Lab
excerpt: This isn't an official phase of the binary bomb lab. This is meant to document what we need to do before launching the bomb for the first time.
mathjax: false
---

# About

These writeups document the steps needed to defuse the self-study version of the [CMU Bomb Lab](https://csapp.cs.cmu.edu/3e/labs.html). The installation and configuration of the tools and environments are left for the reader.

The phases are initially verbose in their explanation of tools and certain assembly instructions. As we move through the phases, they will become less so. This is due to the increasing complexity of the phases and the expectation that the reader now understands these concepts.

# Phase 0

This isn't an official phase of the binary bomb lab.  This is meant to document what we need to do before launching the bomb for the first time.  Mainly, we need to gather a little information about the bomb and make sure our tools are in place.

## Tools

The only tools we'll need are gdb and objdump. While strings can be used, I found that it tends to lead people into guessing.  There's plenty of false flags to frustrate you. There's some valuable information to be gained, but nothing we won't find in gdb. I won't be using strings in this writeup, but you're welcome to try it if you'd like.

You might also be interested in gdb enhancements, such as [gef](https://gef.readthedocs.io/en/master/). While helpful, they're not required for this lab. 

## Configure gdb

One configuration you'll need to make to work with these writeups is to use Intel notation instead of the default AT&T notation.  You could type the following after starting every gdb session:

```
set disassembly-flavor intel
```

The other option is to include this line in .gdbinit:

```bash
echo "set disassembly-flavor intel" >> ~/.gdbinit
```

If you opt to use gef, you won't need to add this line. It's part of the default configuration.

# Gathering Information

Download the bomb from the CMU Bomb Lab, and extract it. You'll see two files of interest, **bomb.c**, and **bomb**.

## bomb.c

In bomb.c, we see some valuable information:

```c
    printf("Welcome to my fiendish little bomb. You have 6 phases with\n");
    printf("which to blow yourself up. Have a nice day!\n");
    
    input = read_line();
    phase_1(input);
    
    /* Wow, they got it!  But isn't something... missing?  Perhaps
     * something they overlooked?  Mua ha ha ha ha! */
```

Here we can see that the bomb has 6 phases, each phase has a function named after it, and we're likely going to miss something.

## bomb

### objdump -t

Since the bomb contains debugging info, we'll be able to recover the name of the functions in the program. As we saw in bomb.c, the author used descriptive function names. Let's see what other functions might be included. Open a terminal and navigate to the directory that contains the bomb file.

Enter the following:

```bash
objdump -t bomb | grep text | awk '{print $NF}' | grep -v "^_" | sort
```

The -t flag tells objdump that we're only interested in the symbol table. We pipe the results into grep to give us only the .text section since that contains a list of the entry points (functions, variables, etc...) within the program.

Since we're only interested in the function names, and not their entry points, we use awk to clean up the output. Using $NF will get us the last field in every line which happens to be the names.

Next, we send the output to grep to match any name that does not start with an underscore. While this isn't strictly necessary given that there are only 4 matches, it does make the output cleaner.

Lastly, we sort the output alphabetically.

Here's what you should see:

```
blank_line
call_gmon_start
deregister_tm_clones
driver_post
explode_bomb
frame_dummy
fun7
func4
init_driver
initialize_bomb
initialize_bomb_solve
init_timeout
invalid_phase
main
phase_1
phase_2
phase_3
phase_4
phase_5
phase_6
phase_defused
read_line
read_six_numbers
register_tm_clones
rio_readlineb
secret_phase
sigalrm_handler
sig_handler
skip
string_length
strings_not_equal
submitr
.text
```

Reading through the list, we see a couple of interesting names: **explode_bomb** and **secret_phase**. 

The explode_bomb function is what is called when we enter bad input.  Knowing its name, we can watch for this function to be called and stop the program from executing it. TThis will save us from detonating the bomb if we supply the wrong information.

The secret_phase function would appear to be the thing we were likely going to miss. Now that we know its there, we can search for it.

### Optional: objdump -d

You can use objdump to disassemble the bomb for further analysis. While I won’t be using this, I’ve included it for the sake of completeness. I'll use gdb for disassembly and including that within the individual phase writeups.

```bash
objdump -M intel -d bomb > bomb-objdump.txt
```

By default, objdump will disassemble into AT&T syntax. While it looks similar, it reads differently than the Intel syntax. We'll use the -M option to convert the output.

By using the -d option you can exclude non-executable sections of the bomb. If you'd prefer, use -D and everything will be included in the output.

# What we know so far

- We have six functions named the six phases of the bomb.
- There's a secret phase
- The phase_defused function plays some role in accessing the secret phase
- There's a function named explode_bomb that we watch for to prevent the bomb from exploding

With this, we're ready to start phase 1!
