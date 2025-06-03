// src/utils/web3.ts
import { BrowserProvider, Contract, Log, EventLog } from "ethers";
import type { Eip1193Provider } from "ethers";
import abi from "../erc1155Abi.json";
export type { NFTAsist }


// Dirección del contrato
const CONTRACT_ADDRESS = "0x1fee62d24daa9fc0a18341b582937be1d837f91d";
const MAX_TOKEN_ID = 100;

interface NFTAsist {
  tokenId: number
  metadata: {
    name: string
    description: string
    image: string
  }
  tema?: string
  clase?: string
  alumno?: string
  fecha?: Date
  fueTransferido?: boolean
}

// Conexión con Metamask y obtención del provider
export function getProvider(): BrowserProvider {
  const ethProvider = (window as Window & { ethereum?: Eip1193Provider }).ethereum;
  if (!ethProvider) throw new Error("Metamask no detectado");
  return new BrowserProvider(ethProvider);
}

// Conecta Metamask y devuelve cuenta + provider
export const connectMetamask = async (): Promise<{
  account: string;
  provider: BrowserProvider;
}> => {
  const provider = getProvider();
  const accounts = await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  await signer.signMessage("Conectar para operar en la dApp de Token Gating.");
  return { account: accounts[0], provider };
};

// Devuelve el signer directamente
export async function getSigner(): Promise<import("ethers").Signer> {
  const provider = getProvider();
  return await provider.getSigner();
}

// Devuelve una instancia del contrato
export const getContract = async (
  provider: BrowserProvider,
  contractAddress: string = CONTRACT_ADDRESS
): Promise<Contract> => {
  const signer = await provider.getSigner()
  return new Contract(contractAddress, abi, signer)
}

// Trae los NFTs que posee una wallet para este contrato
export const fetchNFTsFromWallet = async (
  wallet: string,
  provider: BrowserProvider,
  contractAddr: string = CONTRACT_ADDRESS
): Promise<NFTAsist[]> => {
  
  const signer = await provider.getSigner()
  const contract = new Contract(contractAddr, abi, signer)
  const found: NFTAsist[] = []

  for (let tokenId = 1; tokenId <= MAX_TOKEN_ID; tokenId++) {
      try {
         const balance = await contract.balanceOf(wallet.trim(), tokenId)
         
         if (balance > 0) {
            const uri = await contract.uri(tokenId)
            const finalUri = uri.replace('ipfs://', 'https://ipfs.io/ipfs/').replace('{id}', tokenId.toString())
            const metadata = await fetch(finalUri).then(r => r.json())

            let tema, clase, alumno
            try {
               const datos = await contract.datosDeClases(tokenId)
               clase = datos.clase.toString()
               tema = datos.tema
               alumno = datos.alumno
            } catch {
               console.warn(`Clase y tema no encontrados para Token ID ${tokenId}`)
            }

            let fechaMint = null
            let fueTransferido = false
            try {
               const eventos = await getTransferSingleEvents(contract, tokenId, wallet)
               fechaMint = await getMintDateFromEvents(eventos, wallet, provider)
               fueTransferido = wasTransferredOut(eventos, wallet)
            } catch {
               console.warn(`Eventos no encontrados para Token ID ${tokenId}`)
            }

            console.log(`Token ID ${tokenId} encontrado para wallet ${wallet}:`, {
               tokenId, metadata, tema, clase, alumno, fechaMint, fueTransferido
            })

            found.push({
               tokenId,
               metadata,
               tema,
               clase,
               alumno,
               fecha: fechaMint || undefined,
               fueTransferido: fueTransferido || undefined
            })
         }
    } catch (e) {
      console.error(`Error con token ${tokenId}:`, e)
      continue
    }
  }
  return found
};

// Obtiene la fecha de mint de un token específico
// export const getMintDate = async (
//   contract: Contract,
//   provider: BrowserProvider,
//   wallet: string,
//   tokenId: number
// ): Promise<Date | null> => {
//   try {
//       const events = await contract.queryFilter(
//       contract.filters.TransferSingle(),
//       0, // ← buscar desde el bloque génesis
//       'latest'
//       )
//     console.log("Eventos TransferSingle encontrados:", events.length)
//     const mintEvent = events.find((e) => {
//       if ("args" in e) {
//         return (
//           e.args.id.toString() === tokenId.toString() &&
//           e.args.from === "0x0000000000000000000000000000000000000000" &&
//           e.args.to.toLowerCase() === wallet.toLowerCase()
//         )
//       }
//       return false
//     })

//     if (!mintEvent) return null

//     const block = await provider.getBlock(mintEvent.blockNumber)
//       if (!block) return null;
//       return new Date(block.timestamp * 1000);
//   } catch (e) {
//     console.error(`Error obteniendo timestamp de mint para token ${tokenId}`, e)
//     return null
//   }
// }


// Escanea los eventos TransferSingle para un token específico y wallet
export const getTransferSingleEvents = async (
  contract: Contract,
  tokenId: number,
  wallet: string
): Promise<(Log | EventLog)[]> => {
  try {
    const events = await contract.queryFilter(
      contract.filters.TransferSingle(),
      0,
      "latest"
    )

    return events.filter((e) => {
      if (!("args" in e)) return false

      const idMatch = e.args.id.toString() === tokenId.toString()
      const fromOrToMatch =
        e.args.from.toLowerCase() === wallet.toLowerCase() ||
        e.args.to.toLowerCase() === wallet.toLowerCase()

      return idMatch && fromOrToMatch
    })
  } catch (e) {
    console.error(`Error obteniendo eventos para token ${tokenId}`, e)
    return []
  }
}

// Extrae la fecha de mint (desde = 0x0, hacia wallet)
export const getMintDateFromEvents = async (
  events: (Log | EventLog)[],
  wallet: string,
  provider: BrowserProvider
): Promise<Date | null> => {
  const mintEvent = events.find(
    (e) =>
      "args" in e &&
      e.args.from === "0x0000000000000000000000000000000000000000" &&
      e.args.to.toLowerCase() === wallet.toLowerCase()
  )

  if (!mintEvent) return null

  const block = await provider.getBlock(mintEvent.blockNumber)
  if (!block) return null

  return new Date(block.timestamp * 1000)
}

// Verifica si fue transferido después de recibido
// Recibe todos los eventos TransferSingle() filtrados por token y wallet si alguno tiene from === wallet significa que la wallet fue la que envió el NFT, es decir, lo transfirió fuera.
export const wasTransferredOut = (
  events: (Log | EventLog)[],
  wallet: string
): boolean => {
  return events.some(
    (e) =>
      "args" in e &&
      e.args.from.toLowerCase() === wallet.toLowerCase()
  )
}