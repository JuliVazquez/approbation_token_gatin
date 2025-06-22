// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract AprobationNFT is ERC1155, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    struct Evaluacion {
        string comentario;
        string nota;
        address emisor;
    }

    mapping(uint256 => Evaluacion) private evaluaciones;

    constructor(string memory uri_) ERC1155(uri_) Ownable(msg.sender) {}

    function mintEvaluacion(
        address alumno,
        string memory comentario,
        string memory nota
    ) external {
        require(alumno != address(0), "Adress de alumno no valida");

        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();

        evaluaciones[newTokenId] = Evaluacion({
            comentario: comentario,
            nota: nota,
            emisor: msg.sender
        });

        _mint(alumno, newTokenId, 1, "");
    }

    function getEvaluacion(uint256 tokenId)
        public
        view
        returns (string memory comentario, string memory nota, address emisor)
    {
        Evaluacion storage e = evaluaciones[tokenId];
        return (e.comentario, e.nota, e.emisor);
    }

    function uri(uint256) public pure override returns (string memory) {
        return "ipfs://bafkreidldyeqj2ftj57z25lrx2a5ij47fftbq63q3agwvvjzpbnjbl23ae";
    }
}
