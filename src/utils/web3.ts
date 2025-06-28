// src/utils/web3.ts
import { BrowserProvider, Contract, Log, EventLog } from "ethers";
import type { Eip1193Provider } from "ethers";
import { ABIS } from '../abi/index.js'
export type { NFTAsist }

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

export interface ProofOfWorkData {
  id?: number; // opcional para el mint
  fecha: string;
  alumno: string;
  emisor: string;
  PoF: {
    id: number;
    contractAddress: string; // <- ¡AGREGAR ESTE CAMPO!
  }[];
}

export interface AsistDataExt {
  tokenId: number
  fecha: string
  alumno: string
  emisor: string
  metadata: {
    name: string
    description: string
    image: string
  }
  PoF: {
    id: number
    contractAddress: string
    tema?: string
    clase?: number
  }[]
}

export interface ApprovalNFTData {
  tokenId: string
  comentario: string
  nota: string
  emisor: string
  metadata: {
    name: string
    description: string
    image: string
  }
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
  contractAddress: string,
  abi: import("ethers").InterfaceAbi
): Promise<Contract> => {
  const signer = await provider.getSigner()
  return new Contract(contractAddress, abi, signer)
}

// Trae los NFTs que posee una wallet para este contrato
export const fetchNFTsFromWallet = async (
  wallet: string,
  provider: BrowserProvider,
  contractAddr: string,
): Promise<NFTAsist[]> => {
  
  const contract = await getContract(provider, contractAddr, ABIS.CLASS);
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

// ir por el minteo segun contrato... (feat)
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

export const mintProofOfWorkNFT = async (
  contract: Contract,
  receptor: string,
  data: ProofOfWorkData
): Promise<{ hash: string } | null> => {
  console.log("Mint ProofOfWorkNFT para:", receptor, data);
  try {

    const alteredPoF = [...data.PoF];
    alteredPoF[0] = {
      ...alteredPoF[0],
      id: 999999  // Un ID que el emisor no posee
    };

    const tx = await contract.mintAndTransfer(
      receptor,
      data.fecha,
      data.alumno,
      data.emisor,
      data.PoF,
      // alteredPoF,
      { gasLimit: 1000000 }
    );
    console.log("Tx enviada:", tx.hash);
    await tx.wait();
    console.log("NFT emitido correctamente");
    return { hash: tx.hash };
  } catch (err) {
    console.error("Error al mintear:", err);
    alert("Error al emitir el NFT de Proof of Work. Verifique que cumple con las condiciones de emision.");
    return null;
  }
};

// Función principal para buscar el ProofOfWorkNFT
export const getProofOfWorkNFTForWallet = async (
  wallet: string,
  provider: BrowserProvider,
  contractAddress: string
): Promise<AsistDataExt | null> => {
  const powContract = new Contract(contractAddress, ABIS.POW_TEST, provider)

  for (let tokenId = 1; tokenId <= 100; tokenId++) {
    const balance = await powContract.balanceOf(wallet, tokenId)
    if (balance > 0n) {
      const data = await powContract.getProofOfWork(tokenId)
      const uri = await powContract.uri(0)
      const metadataUrl = uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
      const metadata = await fetch(metadataUrl).then((res) => res.json())

      const detailedPoF = await Promise.all(
        data.PoF.map(async (entry: { id: bigint; contractAddress: string }) => {
          const asistenciaContract = new Contract(entry.contractAddress, ABIS.CLASS, provider)
          try {
            const claseData = await asistenciaContract.datosDeClases(entry.id)
            return {
              id: Number(entry.id),
              contractAddress: entry.contractAddress,
              clase: Number(claseData.clase),
              tema: claseData.tema
            }
          } catch (error) {
            console.warn(`⚠️ No se pudo leer clase/tema para PoF ID ${entry.id}:`, error)
            return {
              id: Number(entry.id),
              contractAddress: entry.contractAddress
            }
          }
        })
      )

      return {
        tokenId,
        fecha: data.fecha,
        alumno: data.alumno,
        emisor: data.emisor,
        PoF: detailedPoF,
        metadata
      }
    }
  }

  return null
}

export const mintApprovalNFT = async (
  contract: Contract,
  alumno: string,
  comentario: string,
  nota: string
): Promise<{ hash: string } | null> => {
  try {
    const tx = await contract.mintEvaluacion(alumno, comentario, nota)
    console.log("⏳ Tx enviada:", tx.hash)
    await tx.wait()
    console.log("✅ NFT de aprobación emitido")
    return { hash: tx.hash }
  } catch (error) {
    console.error("❌ Error al emitir NFT de aprobación:", error)
    return null
  }
}

// utils/web3.ts
export async function getAllApprovalNFTsForWallet(
  wallet: string,
  provider: BrowserProvider,
  contractAddress: string,
  maxTokenId = 2  // Ajusta según el máximo de tokenId que quieras buscar
): Promise<ApprovalNFTData[]> {
  const contract: Contract = await getContract(provider, contractAddress, ABIS.APPROVAL)
  const resultados: ApprovalNFTData[] = []

  for (let tokenId = 1; tokenId <= maxTokenId; tokenId++) {
    try {
      const balance = await contract.balanceOf(wallet, tokenId)
      if (balance.toString() === '0') continue

      const [comentario, nota, emisor]: [string, string, string] = await contract.getEvaluacion(tokenId)
      const uri: string = await contract.uri(tokenId)
      const metadataUrl = uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
      const metadata = await fetch(metadataUrl).then(res => res.json()) as {
        name: string
        description: string
        image: string
      }

      resultados.push({
        tokenId: tokenId.toString(),
        comentario,
        nota,
        emisor,
        metadata
      })
    } catch (error) {
      // Detener en errores críticos, pero continuar si el token no existe
      if (!/execution reverted/i.test((error as Error).message)) {
        console.error(`Error en tokenId ${tokenId}:`, error)
      }
      continue
    }
  }

  return resultados
}

// utils/errors.ts
// utils/errors.ts
export function parseBlockchainError(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const e = error as {
      error?: { message?: string }
      message?: string
      reason?: string
    }

    if (e.error?.message) return e.error.message
    if (e.message) return e.message
    if (e.reason) return e.reason
  }

  return 'Ocurrió un error inesperado al interactuar con el contrato.'
}
