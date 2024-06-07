import { gemdata } from "./Interfaces"


export default async function makeNeuralNetCall(data: gemdata): Promise<any> {
    //todo update endpoint
    const test1 = await fetch('https://cmpm147-final-server-064fe24af464.herokuapp.com/run', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })

    const response = await test1.json()
    return response.data
}

