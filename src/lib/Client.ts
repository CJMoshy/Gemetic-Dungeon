


interface data{
    message: string,
    gems: number[]
}

const data: data = {
    message : 'test',
    gems : [0, 10, 2, 5]
}

export default async function test(){
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

