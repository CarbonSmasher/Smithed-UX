import { NavBar, RootError } from 'components'
import React from 'react'
import { BrowserRouter, createBrowserRouter, HashRouter, Outlet, Route, RouterProvider, Search } from 'react-router-dom'
import { initializeApp } from 'firebase/app'

import Browse from './pages/browse'
import Home from './pages/home'
import Packs from './pages/pack'
import User from './pages/user'
import './style.css'
import { NavOption } from 'components/NavBar'
import { Search as SearchSvg, Home as HomeSvg, Settings as SettingsSvg, Account as AccountSvg } from 'components/svg'
import Account from './pages/account'
import { getAuth, browserLocalPersistence } from 'firebase/auth'
import Edit from './pages/edit'
import Bundles from './pages/bundle'
import Settings from './pages/settings'

interface ClientProps {
    platform: 'desktop' | 'website'
}

initializeApp({
    databaseURL: "https://mc-smithed-default-rtdb.firebaseio.com",
    apiKey: "AIzaSyDX-vLCBhO8StKAxnpvQ2EW8lz3kzYn4Qk",
    authDomain: "mc-smithed.firebaseapp.com",
    projectId: "mc-smithed",
    storageBucket: "mc-smithed.appspot.com",
    messagingSenderId: "574184244682",
    appId: "1:574184244682:web:498d168c09b39e4f0d7b33",
    measurementId: "G-40SRKC35Z0"
})

const router = createBrowserRouter([
    {
        path: "/",
        errorElement: <RootError/>,
        element: <div style={{ height: '100%' }}>
            <NavBar>
                <NavOption SVGComponent={HomeSvg} path='/' title='Home' />
                <NavOption SVGComponent={SearchSvg} path='/browse' title='Browse' />
                <NavOption SVGComponent={AccountSvg} path='/:owner' navigateTo='/account' withSpecialQueryParam='uid' title='Account' />
                <NavOption SVGComponent={SettingsSvg} path='/settings' title='Settings' />
            </NavBar>
            <Outlet />
        </div>,
        children: [
            {
                path: "",
                element: <Home />
            },
            {
                path: "settings",
                element: <Settings/>
            },
            {
                path: "browse",
                element: <Browse />
            },
            {
                path: "account",
                element: <Account />
            },
            {
                path: "edit",
                element: <Edit/>,
            },
            {
                path: ":owner",
                element: <User />
            },
            {
                path: "packs/:id",
                element: <Packs />
            },
            {
                path: 'bundles/:bundleId',
                element: <Bundles/>
            }
        ]
    }
]);

export default function Client({ platform }: ClientProps) {
    return <div>
        <RouterProvider router={router} />
    </div>
}