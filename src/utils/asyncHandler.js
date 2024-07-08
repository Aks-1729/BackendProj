                                
                                // Using Promises:-
const asyncHandler = (requestHandler) => {              //requestHandler is a function
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}

export { asyncHandler }


//const asyncHandler = () => {}
//const asyncHandler = () => { () => {} }----->we can remove these paranthesis
//const asyncHandler = (func) => () => {}
//const asyncHandler = (func) => async () => {}


                        //Using try catch:-
// const asyncHandler = (requestHandler) => async (req, res, next) => {
//     try {
//         await requestHandler(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }