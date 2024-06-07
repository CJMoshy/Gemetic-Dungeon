
export default async function test(data: gemdata): Promise<void>{
    //todo update endpoint
    const test1 = await fetch('http://127.0.0.1:5000/run', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
  
    const txt = await test1.text()
    console.log(txt)
}

