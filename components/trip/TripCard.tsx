
export function TripCard({ route, type, stops, passengers }: TripCardProps) {

    return (
        <div className="border rounded-lg p-3 shadow-sm">

            <div className="flex justify-between font-medium">
                <span>Route : {route}</span>
                <span>{type}</span>
            </div>

            <div className="flex justify-between text-sm mt-2">
                <span>Stops : {stops}</span>
                <span>Passengers : {passengers}</span>
            </div>

            <div className="flex justify-end text-sm">
                <button className="mt-3 border rounded px-5 py-1 text-sm bg-red-500 text-white hover:bg-red-700 cursor-pointer">
                    Edit
                </button>
            </div>

        </div>
    )
}

type TripCardProps = {
    route: string
    type: string
    stops: number
    passengers: number
}