#!/usr/bin/env python

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


if __name__ == "__main__":
    print("Valid first numbers: ", end='')

    for i in range (0,16):
        val = func4(i)

        if val == 0:
            print(str(i) + " ", end='')
