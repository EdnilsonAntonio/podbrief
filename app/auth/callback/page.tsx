"use client"

import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import { useQuery } from "@tanstack/react-query"
import { Loader } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'
import { checkAuthStatus } from "./actions"

const page = () => {
    const router = useRouter();
    const { user } = useKindeBrowserClient();
    const {data, isLoading} = useQuery({
        queryKey: ["checkAuthStatus"],
        queryFn: async () => await checkAuthStatus(),
    });

    if(data?.success) router.push("/");

    return (
        <div className='mt-20 w-full flex justify-center'>
            <div className='flex flex-col items-center gap-2'>
                <Loader className='w-10 h-10 animate-spin text-primary' />
                <h3>Redirecting...</h3>
                <p>Please wait...</p>
            </div>
        </div>
    );
};

export default page