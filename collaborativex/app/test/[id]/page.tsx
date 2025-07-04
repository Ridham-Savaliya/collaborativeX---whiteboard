"use client"
import React from 'react'
import { useParams } from 'next/navigation'

const page = () => {
const params = useParams()
  return (
    <div>
      <h1>this is toattly testting pafe {params.id}</h1>
    </div>
  )
}

export default page
