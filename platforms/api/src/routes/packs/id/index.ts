import { Type } from "@sinclair/typebox";
import { API_APP } from "../../../app.js";
import { getFirestore } from "firebase-admin/firestore";
import { HTTPResponses, PackDataSchema } from "data-types";
import { getUIDFromToken } from "database";


export async function getPackDoc(id: string) {

    const firestore = getFirestore()
    const packs = firestore.collection('packs')

    const doc = await packs.doc(id).get()
    if (doc.exists) {
        return doc
    }
    const query = await packs.where('id', '==', id).limit(1).get()

    if (query.docs.length == 0)
        return undefined

    return query.docs[0]
}

API_APP.route({
    method: 'GET',
    url: '/v2/packs/:id',
    schema: {
        params: Type.Object({
            id: Type.String()
        })
    },
    handler: async (response, reply) => {
        const { id } = response.params;

        const doc = await getPackDoc(id)
        if (doc === undefined)
            return reply.status(HTTPResponses.NOT_FOUND).send(`Pack with ID ${id} was not found`)

        return await doc.get('data')
    }
})

API_APP.route({
    method: 'PATCH',
    url: '/v2/packs/:id',
    schema: {
        params: Type.Object({
            id: Type.String()
        }),
        querystring: Type.Object({
            token: Type.String()
        }),
        body: Type.Object({
            data: PackDataSchema
        })
    },
    handler: async (response, reply) => {
        const { id: packId } = response.params;
        const { token } = response.query
        const { data: packData } = response.body;

        const userId = await getUIDFromToken(token)
        if(userId === undefined)
            return reply.status(HTTPResponses.UNAUTHORIZED).send('Invalid token')
        

        const doc = await getPackDoc(packId)
        if (doc === undefined)
            return reply.status(HTTPResponses.NOT_FOUND).send(`Pack with ID ${packId} was not found`)

        if(!(await doc.get('data.contributors')).includes(userId))
            return reply.status(HTTPResponses.FORBIDDEN).send(`You are not a contributor for ${packId}`)


        await doc.ref.set({data: packData}, {merge: true})
        return reply.status(HTTPResponses.OK).send('Updated data')
    }
})


API_APP.route({
    method: 'DELETE',
    url: '/v2/packs/:id',
    schema: {
        params: Type.Object({
            id: Type.String()
        }),
        querystring: Type.Object({
            token: Type.String()
        })
    },
    handler: async (response, reply) => {
        const { id: packId } = response.params;
        const { token } = response.query
        
        const userId = await getUIDFromToken(token)
        if(userId === undefined)
            return reply.status(HTTPResponses.UNAUTHORIZED).send('Invalid token')
        

        const doc = await getPackDoc(packId)
        if (doc === undefined)
            return reply.status(HTTPResponses.NOT_FOUND).send(`Pack with ID ${packId} was not found`)

        if((await doc.get('data.owner')) !== userId)
            return reply.status(HTTPResponses.FORBIDDEN).send(`You are not the owner of ${packId}`)

        await doc.ref.delete()
        return reply.status(HTTPResponses.OK).send('Deleted data')
    }
})

API_APP.route({
    method: 'POST',
    url: '/v2/packs/:id/contributors',
    schema: {
        params: Type.Object({
            id: Type.String()
        }),
        querystring: Type.Object({
            token: Type.String(),
            contributors: Type.Array(Type.String())
        })
    },
    handler: async (response, reply) => {
        const { id: packId } = response.params;
        const { token, contributors } = response.query
        
        const userId = await getUIDFromToken(token)
        if(userId === undefined)
            return reply.status(HTTPResponses.UNAUTHORIZED).send('Invalid token')
        

        const doc = await getPackDoc(packId)
        if (doc === undefined)
            return reply.status(HTTPResponses.NOT_FOUND).send(`Pack with ID ${packId} was not found`)

        if((await doc.get('data.owner')) !== userId)
            return reply.status(HTTPResponses.FORBIDDEN).send(`You are not the owner of ${packId}`)

        const existingContributors: string[] = await doc.get('contributors')

        for(let c of contributors) 
            if(!existingContributors.includes(c))
                existingContributors.push(c)

        await doc.ref.set({contributors: existingContributors}, {merge: true})
        return reply.status(HTTPResponses.OK).send('Added contributors')
    }
})

API_APP.route({
    method: 'DELETE',
    url: '/v2/packs/:id/contributors',
    schema: {
        params: Type.Object({
            id: Type.String()
        }),
        querystring: Type.Object({
            token: Type.String(),
            contributors: Type.Array(Type.String())
        })
    },
    handler: async (response, reply) => {
        const { id: packId } = response.params;
        const { token, contributors } = response.query
        
        const userId = await getUIDFromToken(token)
        if(userId === undefined)
            return reply.status(HTTPResponses.UNAUTHORIZED).send('Invalid token')
        

        const doc = await getPackDoc(packId)
        if (doc === undefined)
            return reply.status(HTTPResponses.NOT_FOUND).send(`Pack with ID ${packId} was not found`)

        if((await doc.get('data.owner')) !== userId)
            return reply.status(HTTPResponses.FORBIDDEN).send(`You are not the owner of ${packId}`)

        const existingContributors: string[] = await doc.get('contributors')

        await doc.ref.set({contributors: existingContributors.filter(v => !contributors.includes(v))
        }, {merge: true})
        return reply.status(HTTPResponses.OK).send('Deleted contributors')
    }
})

API_APP.route({
    method: 'GET',
    url: '/v2/packs/:id/meta',
    schema: {
        params: Type.Object({
            id: Type.String()
        })
    },
    handler: async (response, reply) => {
        const { id } = response.params;

        const doc = await getPackDoc(id)
        if (doc === undefined)
            return reply.status(HTTPResponses.NOT_FOUND).send(`Pack with ID ${id} was not found`)

        return {
            docId: doc.id,
            stats: await doc.get('stats'),
            owner: await doc.get('owner'),
            contributors: await doc.get('contributors')
        }
    }
})