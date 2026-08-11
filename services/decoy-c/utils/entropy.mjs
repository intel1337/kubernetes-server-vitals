import crypto from 'crypto';

export function GetFloatEntropy(){
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const randomFloat = array[0] / 0xFFFFFFFF;
    const scaledValue = 5.0 + (randomFloat * 5.0);
    const result = scaledValue.toFixed(5);
    return result;
}