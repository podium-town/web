import Head from 'next/head'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Post from '../../components/Post/Post'
import { getPostsForHashtag, IPostProfile } from '../../lib/posts'
import Image from 'next/image'

function TagPage() {
  const [posts, setPosts] = useState<IPostProfile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { tag } = router.query

  useEffect(() => {
    const getData = async () => {
      setIsLoading(true)
      const result = await getPostsForHashtag(`#${tag}`)
      setPosts(result)
      setIsLoading(false)
    }
    getData()
  }, [tag])

  return (
    <>
      <Head>
        <title>Podium — Open social network</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>

      <div className="w-full md:max-w-2xl md:border-r-[1px] h-full">
        {isLoading && (
          <div className="flex justify-center py-8 w-full">
            <Image src="/icons/loading.svg" alt="Back" width={32} height={32} />
          </div>
        )}
        {posts?.map((post: any) => (
          <Post key={post.post.id} post={post} />
        ))}
      </div>
    </>
  )
}

export default TagPage