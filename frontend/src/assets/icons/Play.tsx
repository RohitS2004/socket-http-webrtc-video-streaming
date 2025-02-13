export interface IconProps {
    width: number;
    height: number;
    strokeColor: string;
    strokeWidth: number;
}

const Play = (props: IconProps) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={props.width}
            height={props.height}
            viewBox="0 0 24 24"
            fill="#0F0"
            stroke={props.strokeColor}
            strokeWidth={props.strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="lucide lucide-play"
        >
            <polygon points="6 3 20 12 6 21 6 3" />
        </svg>
    )
}

export default Play;