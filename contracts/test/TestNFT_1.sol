// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract TestNFT_1 is ERC1155, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct PoFEntry {
        uint256 id;
        string tema;
    }

    struct TPData {
        string fecha;
        string alumno;
        address emisor;
        PoFEntry[] PoF;
    }

    mapping(uint256 => TPData) private datos;
    mapping(address => bool) private yaEmitidoTest; // ← solo una vez por alumno (modo test)

    constructor(string memory uri_) ERC1155(uri_) Ownable(msg.sender) {}


    function mintAndTransferTest(TPData calldata input) external {
        require(bytes(input.alumno).length > 0, "Alumno requerido");
        require(input.emisor == msg.sender, "Solo el alumno puede emitir");
        require(!yaEmitidoTest[msg.sender], "Ya emitiste tu NFT de prueba");

        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();

        // Guardar datos variables
        TPData storage nuevo = datos[newTokenId];
        nuevo.fecha = input.fecha;
        nuevo.alumno = input.alumno;
        nuevo.emisor = input.emisor;

        for (uint256 i = 0; i < input.PoF.length; i++) {
            nuevo.PoF.push(PoFEntry({
                id: input.PoF[i].id,
                tema: input.PoF[i].tema
            }));
        }

        yaEmitidoTest[msg.sender] = true;

        _mint(address(this), newTokenId, 1, "");
        safeTransferFrom(address(this), msg.sender, newTokenId, 1, "");
    }

    function datosDeAsist(uint256 tokenId)
        public
        view
        returns (
            string memory fecha,
            string memory alumno,
            address emisor,
            PoFEntry[] memory PoF
        )
    {
        TPData storage d = datos[tokenId];
        fecha = d.fecha;
        alumno = d.alumno;
        emisor = d.emisor;

        PoF = new PoFEntry[](d.PoF.length);
        for (uint256 i = 0; i < d.PoF.length; i++) {
            PoF[i] = d.PoF[i];
        }
    }

function uri(uint256) public pure override returns (string memory) {
    return "ipfs://bafkreibimlves3n72f6ve4grqarekjp6smfbeak5jxq7c66psil5jvtt44";
}

}
