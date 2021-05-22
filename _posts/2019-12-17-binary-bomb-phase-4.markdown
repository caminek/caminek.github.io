---
layout: post
title:  "Binary Bomb: Phase 4"
date:   2019-12-17 16:19:54
categories: reverse-engineering x86-64
tags: reverse-engineering binary-bomb gdb x86-64
series: Binary Bomb Lab
excerpt: Phase 4 is our first real jump in difficulty. Like the last phase, it has multiple correct answer. The difficulty comes from recursion and another function whose purpose isn't clear from just its name. We'll enlist Python to help.
mathjax: false
---

Phase 4 is our first real jump in difficulty. Like the last phase, it has multiple correct answers. The difficulty comes from recursion and another function whose purpose isn't clear from just its name. We'll enlist Python to help.

# Phase 4

Let's start gdb and place a breakpoint on explode_bomb. Once that's done, disassemble phase_4.

```
Dump of assembler code for function phase_4:
   0x000000000040100c <+0>: 	sub    rsp,0x18
   0x0000000000401010 <+4>: 	lea    rcx,[rsp+0xc]
   0x0000000000401015 <+9>: 	lea    rdx,[rsp+0x8]
   0x000000000040101a <+14>:	mov    esi,0x4025cf
   0x000000000040101f <+19>:	mov    eax,0x0
   0x0000000000401024 <+24>:	call   0x400bf0 <__isoc99_sscanf@plt>
   0x0000000000401029 <+29>:	cmp    eax,0x2
   0x000000000040102c <+32>:	jne    0x401035 <phase_4+41>
   0x000000000040102e <+34>:	cmp    DWORD PTR [rsp+0x8],0xe
   0x0000000000401033 <+39>:	jbe    0x40103a <phase_4+46>
   0x0000000000401035 <+41>:	call   0x40143a <explode_bomb>
   0x000000000040103a <+46>:	mov    edx,0xe
   0x000000000040103f <+51>:	mov    esi,0x0
   0x0000000000401044 <+56>:	mov    edi,DWORD PTR [rsp+0x8]
   0x0000000000401048 <+60>:	call   0x400fce <func4>
   0x000000000040104d <+65>:	test   eax,eax
   0x000000000040104f <+67>:	jne    0x401058 <phase_4+76>
   0x0000000000401051 <+69>:	cmp    DWORD PTR [rsp+0xc],0x0
   0x0000000000401056 <+74>:	je     0x40105d <phase_4+81>
   0x0000000000401058 <+76>:	call   0x40143a <explode_bomb> 
   0x000000000040105d <+81>:	add    rsp,0x18
   0x0000000000401061 <+85>:	ret    
End of assembler dump.
```

Similar to the last phase, we see sscanf. Let's get the format string to see what this phase needs for input.

```
x/s 0x4025cf
0x4025cf:	"%d %d"
```

Like Phase 3, this phase will need two numbers. There's also a check after returning from sscanf to ensure that there were two numbers read in, otherwise, we jump to explode_bomb.

```
   0x0000000000401029 <+29>:	cmp    eax,0x2
   0x000000000040102c <+32>:	jne    0x401035 <phase_4+41>
   ...
   0x0000000000401035 <+41>:	call   0x40143a <explode_bomb>
```

The next check ensures that our first input is less than or equal to 15.

```
   0x000000000040102e <+34>:    cmp    DWORD PTR [rsp+0x8],0xe
   0x0000000000401033 <+39>:    jbe    0x40103a <phase_4+46>
   0x0000000000401035 <+41>:    call   0x40143a <explode_bomb>
```

The JBE instruction stands for Jump if Below or Equal. This instruction is similar to the JLE instruction, except JBE performs an unsigned comparison.

We need to make sure our first number is between 0 and 15, inclusive.

After, we see a few registers being set, and then a call to the recursive function, func4:

```
   0x000000000040103a <+46>:    mov    edx,0xe
   0x000000000040103f <+51>:    mov    esi,0x0
   0x0000000000401044 <+56>:    mov    edi,DWORD PTR [rsp+0x8]
   0x0000000000401048 <+60>:    call   0x400fce <func4>
```

These three registers hold what would have been the function arguments in the original C code.

Let's disassemble func4.

```
Dump of assembler code for function func4:
   0x0000000000400fce <+0>: 	sub    rsp,0x8
   0x0000000000400fd2 <+4>: 	mov    eax,edx
   0x0000000000400fd4 <+6>: 	sub    eax,esi
   0x0000000000400fd6 <+8>: 	mov    ecx,eax
   0x0000000000400fd8 <+10>:	shr    ecx,0x1f
   0x0000000000400fdb <+13>:	add    eax,ecx
   0x0000000000400fdd <+15>:	sar    eax,1
   0x0000000000400fdf <+17>:	lea    ecx,[rax+rsi*1]
   0x0000000000400fe2 <+20>:	cmp    ecx,edi
   0x0000000000400fe4 <+22>:	jle    0x400ff2 <func4+36>
   0x0000000000400fe6 <+24>:	lea    edx,[rcx-0x1]
   0x0000000000400fe9 <+27>:	call   0x400fce <func4>
   0x0000000000400fee <+32>:	add    eax,eax
   0x0000000000400ff0  <+34>:	jmp    0x401007 <func4+57>
   0x0000000000400ff2  <+36>:	mov    eax,0x0
   0x0000000000400ff7  <+41>:	cmp    ecx,edi
   0x0000000000400ff9  <+43>:	jge    0x401007 <func4+57>
   0x0000000000400ffb  <+45>:	lea    esi,[rcx+0x1]
   0x0000000000400ffe  <+48>:	call   0x400fce <func4>
   0x0000000000401003 <+53>:	lea    eax,[rax+rax*1+0x1]
   0x0000000000401007 <+57>:	add    rsp,0x8
   0x000000000040100b <+61>:	ret    
End of assembler dump.
```

While the function is only 21 lines of assembly, it can become tricky to keep all the state correct, and a bit of a burden if you happen to start with an invalid number, and have to start again. I opted at this point to create a python program of the above assembly code to test all of the numbers automatically.

For the function name, I chose to keep it as func4. The argument names I kept as the register names. I figured this would be the easiest way to track where I was in the assembly code.

```python
def func4(edi, esi=0, edx=15):
	pass
```

We can ignore the first line as its only making for the address it will eventually have to push on the stack. We don't have to manage the stack, python will do that for us.

Here are the next seven lines:

```
   0x0000000000400fd2 <+4>: 	mov    eax,edx
   0x0000000000400fd4 <+6>: 	sub    eax,esi
   0x0000000000400fd6 <+8>: 	mov    ecx,eax
   0x0000000000400fd8 <+10>:	shr    ecx,0x1f
   0x0000000000400fdb <+13>:	add    eax,ecx
   0x0000000000400fdd <+15>:	sar    eax,1
   0x0000000000400fdf <+17>:    lea    ecx,[rax+rsi*1]
```

These lines are doing the following:

- eax = edx
- eax = eax - esi
- ecx = eax
- ecx = ecx >> 31
- eax = eax + ecx
- eax = eax >> 1
- ecx = eax + esi * 1

We could write that into our code, but there's a lot of simplifications we can make. 

Look at EAX. It's set to EDX which is never going to be greater than 15 or 0b1111. We then decrement it by ESI and set that value to EAX. 

We then set ECX to equal EAX, and then take this 4-bit number and shift it 31 bits to the right. This means ECX will always be 0 at this point.

We add 0 to EAX and then shift it once to the right.

We then set ECX = EAX + ESI * 1. Multiplying by one serves no purpose, so we can skip that. The value of EAX hasn't changed since the second bullet point.

We can simplify the 7 lines above to:

```python
ecx = esi + ((edx - esi) >> 1)
```

Let's look at the next 4 lines:

```
   0x0000000000400fe2 <+20>:    cmp    ecx,edi
   0x0000000000400fe4 <+22>:    jle    0x400ff2 <func4+36>
   0x0000000000400fe6 <+24>:    lea    edx,[rcx-0x1]
   0x0000000000400fe9 <+27>:    call   0x400fce <func4>
```

Here we compare the value stored in ECX with the one in EDI. Remember, EDI is the number between 0 - 15 we've entered.

If EDI is less than or equal to ECX, we jump to another part of the function. Otherwise, we subtract 1 from the ECX and set EDX to that value. We then recursively call func4.

Let's put the lines of python we have together:

```python
def func4(edi, esi=0, edx=15):
	ecx = esi + ((edx - esi) >> 1)
	
	if edi <= ecx:
		eax = func4(edi, esi, ecx - 1)
```

After the recursion reaches the end and starts unwinding, we'll eventually reach the code after the recursive call to func4 was called. Let's look at the code once we reach that point.

```
   0x0000000000400fee <+32>:    add    eax,eax
   0x0000000000400ff0  <+34>:    jmp    0x401007 <func4+57>
   ...
   0x0000000000401007 <+57>:    add    rsp,0x8
   0x000000000040100b <+61>:    ret
```

It appears that the number multiplies itself by two, sets moves the stack pointer and returns. Let's add this to the python code:

```python
def func4(edi, esi=0, edx=15):
	ecx = esi + ((edx - esi) >> 1)
	
	if edi <= ecx:
		eax = func4(edi, esi, ecx - 1)
		return eax + eax
```

Now that we have that portion of the function written, let's explore the path that takes us further down into the function.

```
   0x0000000000400ff2  <+36>:    mov    eax,0x0
   0x0000000000400ff7  <+41>:    cmp    ecx,edi
   0x0000000000400ff9  <+43>:    jge    0x401007 <func4+57>
   0x0000000000400ffb  <+45>:    lea    esi,[rcx+0x1]
   0x0000000000400ffe  <+48>:    call   0x400fce <func4>
   0x0000000000401003 <+53>:    lea    eax,[rax+rax*1+0x1]
   0x0000000000401007 <+57>:    add    rsp,0x8
   0x000000000040100b <+61>:    ret   
```

Here we see EAX being set to 0x0, followed by a comparison of ECX and our input stored at EDI. If EDI is greater or equal to ECX, then we jump to the end of the function.

Otherwise, set ESI = RCX + 0x1 and call func4. Once we return from this call, we'll set EAX = EAX + EAX * 1 + 0x1.

Let's update our python code:


```python
def func4(edi, esi=0, edx=15):
	ecx = esi + ((edx - esi) >> 1)
	
	if edi <= ecx:
		eax = func4(edi, esi, ecx - 1)
		return eax + eax
	else:
		eax = func4(edi, ecx + 1, edx)
		return eax + eax + 1
```

We have all the cases accounted for except one. A way to exit the loop:

```python
def func4(edi, esi=0, edx=15):
	ecx = esi + ((edx - esi) >> 1)
	
	if ecx == edi:
        	return 0
	elif edi <= ecx:
		eax = func4(edi, esi, ecx - 1)
		return eax + eax
	else:
		eax = func4(edi, ecx + 1, edx)
		return eax + eax + 1
```

The only thing missing is a driver program and we can generate our valid first numbers:

```python
if __name__ == "__main__":
    print("Valid first numbers: ", end='')

    for i in range (0,16):
        val = func4(i)

        if val == 0:
            print(str(i) + " ", end='')
```

[Download phase_4.py][1] or combine the code above with the complete func4 code into a text file, and save it as phase_4.py.

You may need to specify that this is a python 3 file depending on your the default version of python you are using. If the above doesn't work, try python3 phase_4.py.  Any troubleshooting beyond this left to the reader.

The output of this code shown below:

```
Valid first numbers: 0 1 3 7
```

Now, let's return to phase_4 and find our second valid number.

```
   0x000000000040104d <+65>:    test   eax,eax
   0x000000000040104f <+67>:    jne    0x401058 <phase_4+76>
   ...
   0x0000000000401058 <+76>:    call   0x40143a <explode_bomb>
```

If EAX is 0, then test eax,eax will set the zero flag which will cause the jump on the next line to not be taken.


```
   0x0000000000401051 <+69>:    cmp    DWORD PTR [rsp+0xc],0x0
   0x0000000000401056 <+74>:    je     0x40105d <phase_4+81>
   0x0000000000401058 <+76>:    call   0x40143a <explode_bomb>
   0x000000000040105d <+81>:    add    rsp,0x18
   0x0000000000401061 <+85>:    ret    
```

The CMP checks to see if our second number is 0. If it's not, the bomb will explode. Our second number can only be 0.

Restart the bomb and use any one of the four valid first numbers, and 0 as your second number.

```
Welcome to my fiendish little bomb. You have 6 phases with
which to blow yourself up. Have a nice day!
Phase 1 defused. How about the next one?
That's number 2.  Keep going!
Halfway there!
3 0
So you got that one.  Try this one.
```

Make sure to update your answer.txt file with the answer to this Phase!

[1]:{{ site.url }}/downloads/binary_bomb/phase_4/phase_4.py
