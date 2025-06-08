// SPDX-License-Identifier: MIT
// URI : "ipfs://bafkreibimlves3n72f6ve4grqarekjp6smfbeak5jxq7c66psil5jvtt44"
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract TEST_POW is ERC1155, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct TPData {
        string fecha;
        string alumno;
        address emisor;
    }

    mapping(uint256 => TPData) private datos;

    constructor(string memory uri_) ERC1155(uri_) Ownable(msg.sender) {}

    function mintAndTransferTest(address receptor, TPData calldata input) external {
        require(bytes(input.alumno).length > 0, "Alumno requerido");
        // require(input.emisor == msg.sender, "Solo el alumno puede emitir");

        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();

        datos[newTokenId] = TPData({
            fecha: input.fecha,
            alumno: input.alumno,
            emisor: input.emisor
        });

        // ✅ Mint directo a la wallet destino
        _mint(receptor, newTokenId, 1, "");
    }

    function datosDeAsist(uint256 tokenId)
        public
        view
        returns (
            string memory fecha,
            string memory alumno,
            address emisor
        )
    {
        TPData storage d = datos[tokenId];
        return (d.fecha, d.alumno, d.emisor);
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] calldata,
        uint256[] calldata,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function uri(uint256) public pure override returns (string memory) {
        return "ipfs://bafkreibimlves3n72f6ve4grqarekjp6smfbeak5jxq7c66psil5jvtt44";
    }
}
