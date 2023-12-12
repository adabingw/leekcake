function Button(props) {
    return (
        <div onClick={props.onClick} 
            className="rounded-lg border-stone-600 text-orange-400 px-2 py-1 border-2 mb-3 mt-3 w-fit hover:cursor-pointer">
            {props.text}
        </div>
    )
}

export default Button;
