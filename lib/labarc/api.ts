import type { InventoryItem } from './types'

const API_URL = process.env.NEXT_PUBLIC_LABARC_API_URL?.replace(/\/$/, '')
const ORGANIZATION_ID = process.env.NEXT_PUBLIC_LABARC_ORGANIZATION_ID

export function isLabArcApiConfigured() {
  return Boolean(API_URL && ORGANIZATION_ID)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_URL || !ORGANIZATION_ID) {
    throw new Error('LabArc API is not configured')
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `LabArc API request failed (${response.status})`)
  }

  return response.json() as Promise<T>
}

export const labarcApi = {
  inventory: {
    list: (departmentId?: string) =>
      request<InventoryItem[]>(
        `/organizations/${ORGANIZATION_ID}/inventory${departmentId ? `?departmentId=${encodeURIComponent(departmentId)}` : ''}`,
      ),
    get: (itemId: string) =>
      request<InventoryItem>(`/organizations/${ORGANIZATION_ID}/inventory/${encodeURIComponent(itemId)}`),
  },
}

export function getApiErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to load data from LabArc API'
}
