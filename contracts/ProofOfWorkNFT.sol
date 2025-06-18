// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ProofOfWorkNFT is ERC1155, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct PoFEntry {
        uint256 id;
        //string tema;
        address  contractAddress; // ← NOTA: se mantiene como string para evitar conflictos en front-end con address[]
    }

    struct TPData {
        string fecha;
        string alumno;
        address emisor;
        PoFEntry[] PoF;
    }

    mapping(uint256 => TPData) private datos;

    constructor(string memory uri_) ERC1155(uri_) Ownable(msg.sender) {}

    function mintAndTransfer(
        address receptor,
        string memory fecha,
        string memory alumno,
        address emisor,
        PoFEntry[] memory PoF
    ) external {
        require(PoF.length == 10, "Se requieren exactamente 10 PoFs");
        require(bytes(alumno).length > 0, "Alumno requerido");
        require(emisor == msg.sender, "Solo el alumno puede emitir");

        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();

        TPData storage nuevo = datos[newTokenId];
        nuevo.fecha = fecha;
        nuevo.alumno = alumno;
        nuevo.emisor = emisor;

        for (uint256 i = 0; i < PoF.length; i++) {
            nuevo.PoF.push(PoFEntry({
                id: PoF[i].id,
                //tema: PoF[i].tema,
                contractAddress: PoF[i].contractAddress
            }));
        }

        _mint(receptor, newTokenId, 1, "");
    }

    function getProofOfWork(uint256 tokenId)
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

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
