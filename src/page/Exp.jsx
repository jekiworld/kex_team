import React from 'react'
import exp from "../data/exp.json"

export default function Exp() {

    return (
        <div>
            {exp.map(item => (
                <div key={item.id}>
                    <h1>{item.title}</h1>
                    <h2>{item.des}</h2>
                </div>
            ))}
        </div>
    )
}
