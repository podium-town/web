import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore'
import { getDownloadURL, getStorage, ref } from 'firebase/storage'
import { ProfileErrorCode } from '../utils/error'

export interface IProfile {
  id: string
  username: string
  createdAt: number
  avatarUrl?: string
  avatarId?: string
  following: string[]
  blockedPosts: string[]
  blockedProfiles: string[]
}

export async function getProfile(id: string) {
  try {
    const db = getFirestore()
    const storage = getStorage()
    const reference = doc(db, 'users', id)
    const document = await getDoc(reference)
    const data = document.data() as IProfile

    if (!data) {
      throw ProfileErrorCode.PROFILE_NOT_FOUND
    }

    if (data?.avatarId) {
      const avatarRef = ref(storage, `${data.id}/${data.avatarId}.png`)
      const avatarUrl = await getDownloadURL(avatarRef)
      return {
        ...data,
        avatarUrl
      }
    }

    return data
  } catch (error) {
    throw error
  }
}

export async function follow(fromId: string, id: string) {
  const db = getFirestore()
  const reference = doc(db, 'users', fromId)
  await updateDoc(reference, {
    following: arrayUnion(id)
  })
}

export async function unfollow(fromId: string, id: string) {
  const db = getFirestore()
  const reference = doc(db, 'users', fromId)
  await updateDoc(reference, {
    following: arrayRemove(id)
  })
}

export async function isUsernameAvailable(username: string) {
  const db = getFirestore()
  const profileQuery = query(collection(db, 'users'), where('username', '==', username))
  const documents = await getDocs(profileQuery)

  return documents.docs.length === 0
}

export async function createProfile(id: string, username: string) {
  try {
    const db = getFirestore()
    const reference = doc(db, 'users', id)
    const data: IProfile = {
      id,
      username,
      following: [id],
      blockedPosts: [],
      blockedProfiles: [],
      createdAt: Math.round(Date.now() / 1000)
    }
    const isAvailable = await isUsernameAvailable(username)
    if (isAvailable) {
      await setDoc(reference, data)
      return data
    } else {
      throw ProfileErrorCode.USERNAME_TAKEN
    }
  } catch (error) {
    throw error
  }
}

export async function getProfileByUsername(username: string) {
  const db = getFirestore()
  const storage = getStorage()
  const profileQuery = query(collection(db, 'users'), where('username', '==', username))
  const documents = await getDocs(profileQuery)
  const data = documents.docs[0].data() as IProfile

  if (data?.avatarId) {
    const avatarRef = ref(storage, `${data.id}/${data.avatarId}.png`)
    const avatarUrl = await getDownloadURL(avatarRef)
    return {
      ...data,
      avatarUrl
    }
  }

  return data
}

export async function getProfiles(ids: string[]) {
  const db = getFirestore()
  const storage = getStorage()
  const profilesQuery = query(collection(db, 'users'), where('id', 'in', ids))
  const { docs } = await getDocs(profilesQuery)
  const profiles = await Promise.all(
    docs.map(async (profile) => {
      const data = profile.data()
      if (data.avatarId) {
        const starsRef = ref(storage, `${data.id}/${data.avatarId}.png`)
        const avatarUrl = await getDownloadURL(starsRef)
        return {
          ...data,
          avatarUrl
        }
      }
      return data
    })
  )

  return profiles as IProfile[]
}

export async function blockProfile(id: string, fromProfile: IProfile) {
  const db = getFirestore()
  const reference = doc(db, 'users', fromProfile.id)
  await updateDoc(reference, {
    blockedProfiles: arrayUnion(id)
  })
}
