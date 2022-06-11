//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.9;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract UnlockableNFT is ERC721URIStorage {
    enum NFTState {
        onSale,
        WaitingForApproval,
        Sold
    }
    struct NFT {
        uint256 id;
        address payable owner;
        address creator;
        uint256 price;
        string name;
        string description;
        string publicURL;
        string unlockableURL;
        NFTState state;
        address payable nextOwner;
    }

    mapping(uint256 => NFT) public nfts;

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    string myname = "Unlockable NFT";

    uint256 money = 0;

    constructor() ERC721("Metaverse Tokens", "METT") {}

    function updateNFT(
        uint256 _id,
        uint256 _price,
        bool _onSale
    ) public {
        require(msg.sender == nfts[_id].owner, "Only the owner can sell NFT");
        require(
            nfts[_id].state != NFTState.WaitingForApproval,
            "Item is already waiting for approval"
        );
        require(_id > 0);
        // require(nfts[_id].state == false);
        if (_onSale == true) {
            nfts[_id].state = NFTState.onSale;
        } else {
            nfts[_id].state = NFTState.Sold;
        }
        nfts[_id].price = _price;
    }

    function createNFT(
        string memory _publicURL,
        string memory _unlockableURL,
        uint256 _price
    ) public {
        require(_price > 0);

        _tokenIds.increment();
        uint256 _id = _tokenIds.current();

        _mint(msg.sender, _id);

        nfts[_id].id = _id;
        nfts[_id].owner = payable(msg.sender);
        nfts[_id].creator = msg.sender;
        nfts[_id].publicURL = _publicURL;
        nfts[_id].unlockableURL = _unlockableURL;
        nfts[_id].price = _price;
        nfts[_id].state = NFTState.Sold;
    }

    function fetchNFTs() public view returns (NFT[] memory) {
        uint256 itemCount = _tokenIds.current();
        NFT[] memory items = new NFT[](itemCount);

        for (uint256 i = 1; i <= itemCount; i++) {
            NFT storage currentItem = nfts[i];
            items[i - 1] = currentItem;
        }
        return items;
    }

    function buyNFT(uint256 _id) public payable {
        require(_id > 0);
        require(nfts[_id].state == NFTState.onSale);
        require(nfts[_id].owner != msg.sender);

        require(msg.value >= nfts[_id].price);

        money += msg.value;

        nfts[_id].state = NFTState.WaitingForApproval;
        nfts[_id].nextOwner = payable(msg.sender);
    }

    function approveSale(uint256 _id, string memory newUnlockableURL) public {
        require(
            msg.sender == nfts[_id].owner,
            "Only the owner can approve NFT"
        );

        require(nfts[_id].state == NFTState.WaitingForApproval);
        nfts[_id].owner.transfer(nfts[_id].price);
        _transfer(nfts[_id].owner, nfts[_id].nextOwner, _id);

        nfts[_id].owner = nfts[_id].nextOwner;
        nfts[_id].nextOwner = payable(0);
        nfts[_id].unlockableURL = newUnlockableURL;

        nfts[_id].state = NFTState.Sold;
    }

    function greet() public view returns (string memory) {
        return myname;
    }

    function setGreeting(string memory _greeting) public payable {
        myname = _greeting;
    }

    function makePayment(string memory _greeting) public payable {
        console.log("Payment made");
        console.log(msg.value);
        console.log(msg.sender);
        money += msg.value;
    }
}
