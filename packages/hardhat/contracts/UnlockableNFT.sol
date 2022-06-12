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
        string nextOwnerPublicKey;
    }

    mapping(uint256 => NFT) public nfts;

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    constructor() ERC721("Unlockable NFT", "UNFT") {}

    function updateNFT(
        uint256 _id,
        uint256 _price,
        bool _onSale
    ) public {
        NFT storage nft = nfts[_id];

        require(msg.sender == nft.owner, "Only the owner can sell NFT");
        require(
            nft.state != NFTState.WaitingForApproval,
            "Item is already waiting for approval"
        );
        require(_id > 0);
        // require(nft.state == false);
        if (_onSale == true) {
            nft.state = NFTState.onSale;
        } else {
            nft.state = NFTState.Sold;
        }
        nft.price = _price;
    }

    function createNFT(
        string memory name,
        string memory description,
        string memory _publicURL,
        string memory _unlockableURL,
        uint256 _price
    ) public {
        require(_price > 0);

        _tokenIds.increment();
        uint256 _id = _tokenIds.current();

        _mint(msg.sender, _id);

        NFT storage nft = nfts[_id];

        nft.id = _id;
        nft.name = name;
        nft.description = description;
        nft.owner = payable(msg.sender);
        nft.creator = msg.sender;
        nft.publicURL = _publicURL;
        nft.unlockableURL = _unlockableURL;
        nft.price = _price;
        nft.state = NFTState.Sold;
    }

    function fetchNFTs() public view returns (NFT[] memory) {
        uint256 itemCount = _tokenIds.current();
        NFT[] memory items = new NFT[](itemCount);

        for (uint256 i = 1; i <= itemCount; i++) {
            NFT memory currentItem = nfts[i];
            items[i - 1] = currentItem;
        }
        return items;
    }

    function buyNFT(uint256 _id, string memory publicKey) public payable {
        require(_id > 0);
        NFT storage nft = nfts[_id];

        require(nft.state == NFTState.onSale);
        require(nft.owner != msg.sender);

        require(msg.value >= nft.price);

        nft.state = NFTState.WaitingForApproval;
        nft.nextOwner = payable(msg.sender);
        nft.nextOwnerPublicKey = publicKey;
    }

    function approveSale(uint256 _id, string memory newUnlockableURL) public {
        NFT storage nft = nfts[_id];

        require(msg.sender == nft.owner, "Only the owner can approve NFT");

        require(nft.state == NFTState.WaitingForApproval);
        nft.owner.transfer(nft.price);
        _transfer(nft.owner, nft.nextOwner, _id);

        nft.owner = nft.nextOwner;
        nft.nextOwner = payable(0);
        nft.nextOwnerPublicKey = "";
        nft.unlockableURL = newUnlockableURL;

        nft.state = NFTState.Sold;
    }
}
