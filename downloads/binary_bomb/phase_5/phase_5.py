#!/usr/bin/env python

if __name__ == "__main__":
    unencrypted = "flyers"
    key = "maduiersnfotvbyl"
    
    print("Encrypted string: " , end='')

    for i in range(0,6):
        x = (ord(unencrypted[i]) - ord('a'))
        for j in range(0,16):
            if key[j] == unencrypted[i]:
                print(chr(ord('a') + j - 1) , end='')
                break
