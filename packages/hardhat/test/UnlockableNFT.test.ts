import { expect } from "chai";
import { ethers } from "hardhat";
import crypto from 'crypto';

const key = crypto.randomBytes(192 / 8)
const iv = crypto.randomBytes(128 / 8)
const algorithm = 'aes192'
const encoding = 'hex'


const encrypt = (text: crypto.BinaryLike) => {
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    cipher.update(text)
    return cipher.final(encoding)
}

const decrypt = (encrypted: string) => {
    const decipher = crypto.createDecipheriv(algorithm, key, iv)
    decipher.update(encrypted, encoding)
    return decipher.final('utf8')
}


describe("Greeter", function () {
    it("Should return the new greeting once it's changed", async function () {


        const content = 'Hello Node.js'
        const crypted = encrypt(content)
        console.log(crypted)
        
        // db75f3e9e78fba0401ca82527a0bbd62
        
        const decrypted = decrypt(crypted)
        console.log(decrypted)
        
        expect(decrypted).to.equal(content)
        // expect(decrypted).to.equal("content")
        expect(crypted).to.equal("content")

        // Hello Node.js
        
    //   expect().to.equal();
    });
  });
  

