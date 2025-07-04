// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract ApprovalNFT is ERC1155, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // Dirección del contrato ProofOfWorkNFT
    address public constant POW_CONTRACT_ADDRESS = 0x612E590817f663103BD1c853F1152d12BdAFD415;

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
        require(alumno != address(0), "Adress de alumno invalida");
        require(_poseeProofOfWork(msg.sender), "El emisor no posee un ProofOfWorkNFT");

        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();

        evaluaciones[newTokenId] = Evaluacion({
            comentario: comentario,
            nota: nota,
            emisor: msg.sender
        });

        _mint(alumno, newTokenId, 1, "");
    }

    function _poseeProofOfWork(address emisor) internal view returns (bool) {
        ERC1155 pow = ERC1155(POW_CONTRACT_ADDRESS);
        for (uint256 i = 1; i <= 1000; i++) {
            try pow.balanceOf(emisor, i) returns (uint256 b) {
                if (b > 0) return true;
            } catch {
                return false;
            }
        }
        return false;
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
        return "ipfs://bafkreidrnwrxzgjnykeyhhmxw5c5mw432tbnyo4i2t5drsq3aeblyxf6x4";
    }
}
