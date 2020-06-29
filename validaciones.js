
function validar_registro(username, password) {
    if (username.length<3 || password.length<4) {
        return false;
    }
    return true;
}


function validar_login(username, password) {
    if (username.length<3 || password.length<4) {
        return false;
    }
    return true;
}

module.exports = {
    validar_login,
    validar_registro
}