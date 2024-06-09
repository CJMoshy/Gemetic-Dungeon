import { gemdata } from "./Interfaces"

/**
 * @function makeNeuralNetCall makes a call to the neural net API with the exported data
 * @param {gemdata} data the gem data to be sent to the API
 * @returns {number[]} unparsed data response from the net/API
 */
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

