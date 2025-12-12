/**
 * Steganography Service
 * Implements Least Significant Bit (LSB) encoding to hide data within image pixels and audio samples.
 */

// Helper to convert string to binary string
const stringToBinary = (str: string): string => {
  let result = "";
  for (let i = 0; i < str.length; i++) {
    const bin = str.charCodeAt(i).toString(2).padStart(8, "0"); 
    result += bin;
  }
  return result;
};

// Helper to convert binary string to text
const binaryToString = (bin: string): string => {
  let result = "";
  for (let i = 0; i < bin.length; i += 8) {
    result += String.fromCharCode(parseInt(bin.substr(i, 8), 2));
  }
  return result;
};

// Delimiter to know when the message stops
const END_DELIMITER = "||END_KAVACH||";

// --- IMAGE STEGANOGRAPHY ---

export const hideTextInImage = (
  image: HTMLImageElement,
  text: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    const fullMessage = text + END_DELIMITER;
    const binaryMessage = stringToBinary(fullMessage);
    
    if (binaryMessage.length > data.length * 0.75) {
      reject(new Error("Message is too long for this image. Please use a larger image or shorter message."));
      return;
    }

    let dataIndex = 0;

    for (let i = 0; i < data.length; i += 4) {
      if (dataIndex >= binaryMessage.length) break;

      if (dataIndex < binaryMessage.length) {
        data[i] = (data[i] & 254) | parseInt(binaryMessage[dataIndex]);
        dataIndex++;
      }
      if (dataIndex < binaryMessage.length) {
        data[i+1] = (data[i+1] & 254) | parseInt(binaryMessage[dataIndex]);
        dataIndex++;
      }
      if (dataIndex < binaryMessage.length) {
        data[i+2] = (data[i+2] & 254) | parseInt(binaryMessage[dataIndex]);
        dataIndex++;
      }
    }

    ctx.putImageData(imgData, 0, 0);
    resolve(canvas.toDataURL("image/png"));
  });
};

export const revealTextFromImage = (image: HTMLImageElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    let binaryMessage = "";
    
    for (let i = 0; i < data.length; i += 4) {
       binaryMessage += (data[i] & 1).toString();
       binaryMessage += (data[i+1] & 1).toString();
       binaryMessage += (data[i+2] & 1).toString();
    }

    const allText = binaryToString(binaryMessage);
    const stopIndex = allText.indexOf(END_DELIMITER);
    
    if (stopIndex !== -1) {
      resolve(allText.substring(0, stopIndex));
    } else {
      reject(new Error("No hidden KAVACH message detected in this image."));
    }
  });
};

// --- AUDIO STEGANOGRAPHY (WAV LSB) ---

/**
 * Hides text in a WAV file by modifying the LSB of data bytes.
 * NOTE: This assumes a standard WAV format.
 */
export const hideTextInAudio = async (audioFile: File, text: string): Promise<string> => {
  const arrayBuffer = await audioFile.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  // Find "data" chunk signature to safely skip header
  let dataOffset = -1;
  for(let i=0; i < bytes.length - 4; i++) {
     // 'd' 'a' 't' 'a' in ASCII is 100, 97, 116, 97
     if(bytes[i] === 100 && bytes[i+1] === 97 && bytes[i+2] === 116 && bytes[i+3] === 97) {
       dataOffset = i + 8; // skip 'data' (4) + size (4)
       break;
     }
  }

  if (dataOffset === -1) {
    // Fallback: standard 44 bytes wav header
    dataOffset = 44; 
  }

  const fullMessage = text + END_DELIMITER;
  const binaryMessage = stringToBinary(fullMessage);

  if (binaryMessage.length > (bytes.length - dataOffset)) {
    throw new Error("Message too long for this audio file.");
  }

  // Embed LSB
  for (let i = 0; i < binaryMessage.length; i++) {
    const byteIndex = dataOffset + i;
    if (byteIndex < bytes.length) {
      bytes[byteIndex] = (bytes[byteIndex] & 254) | parseInt(binaryMessage[i]);
    }
  }

  const blob = new Blob([bytes], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
};

export const revealTextFromAudio = async (audioFile: File): Promise<string> => {
  const arrayBuffer = await audioFile.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  let dataOffset = -1;
  for(let i=0; i < bytes.length - 4; i++) {
     if(bytes[i] === 100 && bytes[i+1] === 97 && bytes[i+2] === 116 && bytes[i+3] === 97) {
       dataOffset = i + 8;
       break;
     }
  }

  if (dataOffset === -1) {
    dataOffset = 44;
  }

  // Extract LSBs
  // Optimization: Reading the whole file to binary string is too slow for large audio.
  // We read byte by byte until we find the delimiter.
  
  let resultText = "";
  let currentBin = "";
  let delimCheck = "";
  
  for (let i = dataOffset; i < bytes.length; i++) {
     currentBin += (bytes[i] & 1).toString();
     
     if (currentBin.length === 8) {
       const char = String.fromCharCode(parseInt(currentBin, 2));
       resultText += char;
       currentBin = "";
       
       // Optimization: Check for delimiter every character
       // This prevents OOM on large files by stopping early
       if (resultText.endsWith(END_DELIMITER)) {
          return resultText.substring(0, resultText.indexOf(END_DELIMITER));
       }
     }
  }

  throw new Error("No hidden KAVACH message detected in this audio.");
};