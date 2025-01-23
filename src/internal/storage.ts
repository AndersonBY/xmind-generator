import { NamedResourceData, ResourceData, ResourcePath } from '../storage'

export type SimpleStorage<K extends string, V> = { [key in K]: V }

export type ResourceStorage = SimpleStorage<ResourcePath, ResourceData>

export interface ImageResourceStorageHandler {
  storage: ResourceStorage
  set: (data: NamedResourceData) => Promise<ResourcePath | null>
  get: (resourcePath: ResourcePath) => ResourceData | null
}

export function makeImageResourceStorage(): ImageResourceStorageHandler {
  const resourceStorage: ResourceStorage = {}
  return {
    storage: resourceStorage,
    set: async (resource: NamedResourceData) => {
      const resourcePath = await computeResourcePath(resource)
      resourceStorage[resourcePath] = resource.data
      return resourcePath
    },
    get: (resourcePath: ResourcePath) => {
      return resourceStorage[resourcePath] ?? null
    }
  }
}

export async function computeResourcePath(resource: NamedResourceData) {
  const hash = await generateSHA256Hash(resource.data)
  const extname = fileExtname(resource.name)
  return extname ? `${hash}.${extname}` : hash
}

function fileExtname(fileName: string) {
  return fileName.lastIndexOf('.') !== -1 ? fileName.substring(fileName.lastIndexOf('.') + 1) : ''
}

async function generateSHA256Hash(data: ResourceData) {
  const encoder = new TextEncoder();
  const dataBuffer = typeof data === 'string' ? encoder.encode(data) : data;

  return crypto.subtle.digest('SHA-256', dataBuffer).then(hashBuffer => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
    return hashHex;
  });
}
