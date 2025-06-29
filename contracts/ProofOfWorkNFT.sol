// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

// Interface necesaria para validar balance en contrato externo
interface IClassNFT {
    function balanceOf(address account, uint256 id) external view returns (uint256);
}

contract ProofOfWorkNFT is ERC1155, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    // Dirección del contrato ClassNFT
    address constant CLASS_NFT_ADDRESS = 0x1FEe62d24daA9fc0a18341B582937bE1D837F91d;

    struct PoFEntry {
        uint256 id;
        address contractAddress;
    }

    struct TPData {
        string fecha;
        string alumno;
        address emisor;
        PoFEntry[] PoF;
    }

    mapping(uint256 => TPData) private datos;

    // Constructor con URI
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

        // Validar contractAddress y propiedad del token
        IClassNFT classNFT = IClassNFT(CLASS_NFT_ADDRESS);
        for (uint256 i = 0; i < PoF.length; i++) {
            require(
                PoF[i].contractAddress == CLASS_NFT_ADDRESS,
                "PoF debe provenir de CLASS_NFT"
            );
            require(
                classNFT.balanceOf(msg.sender, PoF[i].id) > 0,
                "El alumno no posee el PoF indicado"
            );
        }
        // Validar que el receptor no tenga un ProofOfWorkNFT
        for (uint256 i = 1; i <= _tokenIdCounter.current(); i++) {
            if (balanceOf(receptor, i) > 0) {
                revert("El receptor ya posee un ProofOfWorkNFT");
            }
        }

        _tokenIdCounter.increment();
        uint256 newTokenId = _tokenIdCounter.current();

        TPData storage nuevo = datos[newTokenId];
        nuevo.fecha = fecha;
        nuevo.alumno = alumno;
        nuevo.emisor = emisor;

        for (uint256 i = 0; i < PoF.length; i++) {
            nuevo.PoF.push(PoFEntry({
                id: PoF[i].id,
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
