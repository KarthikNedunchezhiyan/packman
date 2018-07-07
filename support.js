function buildMatrix(row,col){
    let mat = new Array(row);
    for(let i=0;i<row;i++)
        mat[i] = new Array(col);
    return mat;
}

function clone(target){
    let mat = buildMatrix(target.length,target[0].length);
    for(let i=0;i<target.length;i++)
        for(let j=0;j<target[0].length;j++)
            mat[i][j] = target[i][j];
    return mat;
}
