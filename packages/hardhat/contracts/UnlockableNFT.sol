//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract UnlockableNFT is ERC721URIStorage {
    struct NFT {
        uint256 id;
        address owner;
        uint256[] urls;
    }

    mapping(address => NFT) public nfts;

    address payable owner;

    constructor() ERC721("Metaverse Tokens", "METT") {
        owner = payable(msg.sender);
    }

    function greet() public view returns (string memory) {
        return "";
    }

    function setGreeting(string memory _greeting) public {}
}
