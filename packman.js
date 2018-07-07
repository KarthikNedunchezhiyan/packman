class Cell{
    constructor(top,left,size,value){
        this.top = top;
        this.left = left;
        this.value = value;
        this.size = size;
        this.target = this.createCell();
    }

    createCell(){
        let cell = document.createElement("div");
        cell.style.top = (this.top*this.size)+"vw";
        cell.style.left = (this.left*this.size)+"vw";
        cell.style.height = (this.size)+"vw";
        cell.style.width = (this.size)+"vw";
        cell.classList.add("cell");
        let inner = document.createElement("div");
        inner.classList.add("inner");
        cell.appendChild(inner);
        document.getElementById("PlayArea").appendChild(cell);
        return cell;
    }
}

class Player{
    constructor(pos,board,values){
        this.dir = [0,0];
        this.pos = pos;
        this.prev = 0;
        this.board = board;
        this.food = values[1];
        this.boost = values[2];
        this.player = values[3];
        this.empty = values[4];
        this.opponent = values[5];
        this.boostTime = 0;
        this.totalScore = 0;
    }

    moveAsPlayer(newPos){
        this.board[this.pos[0]][this.pos[1]].value = this.empty;
        this.pos = (newPos==undefined)?[this.pos[0]+this.dir[0],this.pos[1]+this.dir[1]]:newPos;
        if(this.board[this.pos[0]][this.pos[1]].value==this.boost)
            this.boostTime = 50;
        this.prev = this.board[this.pos[0]][this.pos[1]].value;
        this.board[this.pos[0]][this.pos[1]].value = this.player;
        if(this.prev==this.food)
            this.totalScore+=5;
        if(this.prev==this.opponent) {
            this.totalScore+=(this.boostTime>0)?50:0;
            return true;
        }
    }

    moveAsOpponent(newPos){
        this.board[this.pos[0]][this.pos[1]].value = this.prev;
        this.pos = (newPos==undefined)?[this.pos[0]+this.dir[0],this.pos[1]+this.dir[1]]:newPos;
        this.prev = this.board[this.pos[0]][this.pos[1]].value;
        this.board[this.pos[0]][this.pos[1]].value = this.opponent;
        if(this.prev==this.player)
            return true;
    }

    changeDir(newDir){
        this.dir = newDir;
    }
}

class PackMan{
    constructor(boardLayout,cell_size,pos,values,vault,valutDoor){
        this.boardLayout = clone(boardLayout);
        this.cell_size = cell_size;
        this.vault = vault;
        this.vaultDoor = valutDoor;
        this.wall = values[0];
        this.food = values[1];
        this.boost = values[2];
        this.player = values[3];
        this.empty = values[4];
        this.opponent = values[5];
        this.values = values;
        this.frames = 0;
        this.boardLayout[pos[0]][pos[1]] = this.player;
        this.board = this.buildEnvironment();
        this.target = new Player(pos,this.board,values);
        this.opponents = [];
        this.memset = [];
    }

    buildEnvironment(){
        let board = buildMatrix(this.boardLayout.length,this.boardLayout[0].length);
        for(let i=0;i<this.boardLayout.length;i++)
            for(let j=0;j<this.boardLayout[0].length;j++){
                board[i][j] = new Cell(i,j,this.cell_size,this.boardLayout[i][j]);
            }
        return board;
    }

    update(){
        if(this.playerMove()==true){
            if(this.target.boostTime<=0)
                this.gameOver("Game Over!");
            this.memset.push(this.target.pos);
            this.memset.push(this.vault);
        }

        if(this.target.boostTime<=0 || this.frames%2==0) {
            this.opponentMove(this.target.boostTime > 0 ? -1 : 1);
            this.changeDoorState(this.empty);
        }
        if(this.target.boostTime>0) {
            this.target.boostTime--;
            this.changeDoorState(this.wall);
        }

        this.frames++;
        let won = true;
        for(let i=0;i<this.board.length;i++)
            for(let j=0;j<this.board[0].length;j++){
                this.board[i][j].target.children[0].classList = [];
                this.board[i][j].target.style.backgroundColor = "black";
                if(this.board[i][j].value==this.wall)
                    this.board[i][j].target.style.backgroundColor = "blue";
                else if(this.board[i][j].value==this.food || this.board[i][j].value==this.boost) {
                    won = false;
                    this.board[i][j].target.children[0].classList.add("food");
                    this.board[i][j].target.children[0].style.height = (this.cell_size/(this.board[i][j].value==this.food?3.5:2))+"vw";
                    this.board[i][j].target.children[0].style.width = (this.cell_size/(this.board[i][j].value==this.food?3.5:2))+"vw";
                }else if(this.board[i][j].value==this.player || this.board[i][j].value==this.opponent){
                    this.board[i][j].target.children[0].classList.add((this.board[i][j].value==this.player)?"player":"opponent");
                    if(this.board[i][j].value==this.opponent && this.target.boostTime>0)
                        this.board[i][j].target.children[0].classList.add("fear");
                    this.board[i][j].target.children[0].style.height = (this.cell_size/1.2)+"vw";
                    this.board[i][j].target.children[0].style.width = (this.cell_size/1.2)+"vw";
                }
            }
        document.getElementById("score").innerText = "Score : "+this.target.totalScore;
        if(won==true)
            this.gameOver("You Won!");
    }

    changeDoorState(state){
        for(let i=0;i<this.vaultDoor.length;i++)
            if(this.board[this.vaultDoor[i][0]][this.vaultDoor[i][1]].value==this.wall || this.board[this.vaultDoor[i][0]][this.vaultDoor[i][1]].value==this.empty)
                this.board[this.vaultDoor[i][0]][this.vaultDoor[i][1]].value = state;
    }

    opponentMove(symbol){
        let initialVal = symbol*Infinity;

        for(let i=0;i<this.board.length;i++)
            for(let j=0;j<this.board[0].length;j++)
                if (this.board[i][j].value == this.opponent) {
                    let scores = [initialVal, i, j];
                    scores = this.oppMin(scores[0],this.calculateDistance(i+1,j,initialVal),scores[1],scores[2],i+1,j,initialVal);
                    scores = this.oppMin(scores[0], this.calculateDistance(i,j+1,initialVal), scores[1], scores[2], i, j + 1,initialVal);
                    scores = this.oppMin(scores[0], this.calculateDistance(i-1,j,initialVal), scores[1], scores[2], i - 1, j,initialVal);
                    scores = this.oppMin(scores[0], this.calculateDistance(i,j-1,initialVal), scores[1], scores[2], i, j - 1,initialVal);
                    this.memset.push([i,j]);
                    this.memset.push([scores[1],scores[2]]);
                }
        for(let i=0;i<this.memset.length;i+=2)
            for(let j=0;j<this.opponents.length;j++) {
                if (this.opponents[j].pos[0] == this.memset[i][0] && this.opponents[j].pos[1] == this.memset[i][1]) {
                    if(this.opponents[j].moveAsOpponent(this.memset[i + 1])==true) {
                        if(this.target.boostTime<=0)
                            this.gameOver("Game Over!");
                        else{
                            this.target.totalScore += 50;
                            this.opponents[j].moveAsOpponent(this.vault);
                        }
                    }

                    break;
                }
            }
        this.memset = [];
    }

    calculateDistance(i,j,initialVal){
        if(i<0 || j<0 || i>=this.board.length || j>=this.board[0].length || this.board[i][j].value==this.wall || this.board[i][j].value==this.opponent)
            return initialVal;
        let distance = Math.abs(i-this.target.pos[0])+Math.abs(j-this.target.pos[1]);
        if(distance>this.board.length/2)
            return Math.random()*1000;
        return distance;
    }

    oppMin(prevScore,currentScore,pi,pj,ci,cj,initialVal){
        if((initialVal<0&&prevScore>currentScore) || (initialVal>0&&prevScore<currentScore))
            return [prevScore,pi,pj];
        return [currentScore,ci,cj];
    }

    playerMove(){
        if((this.target.pos[0]+this.target.dir[0])<0 || (this.target.pos[0]+this.target.dir[0])>=this.board.length || (this.target.pos[1]+this.target.dir[1])<0 || (this.target.pos[1]+this.target.dir[1])>=this.board[0].length || this.board[this.target.pos[0]+this.target.dir[0]][this.target.pos[1]+this.target.dir[1]].value==this.wall)
            return;
        return this.target.moveAsPlayer();
    }

    changeDir(newDir){
        if((this.target.pos[0]+newDir[0])<0 || (this.target.pos[0]+newDir[0])>=this.board.length || (this.target.pos[1]+newDir[1])<0 || (this.target.pos[1]+newDir[1])>=this.board[0].length || this.board[this.target.pos[0]+newDir[0]][this.target.pos[1]+newDir[1]].value==this.wall)
            return;
        this.target.changeDir(newDir);
    }

    pushOpponent(pos){
        let prev = this.board[pos[0]][pos[1]].value;
        this.board[pos[0]][pos[1]].value = 6;
        let opp = new Player(pos,this.board,this.values);
        opp.prev=prev;
        this.opponents.push(opp);
    }

    gameOver(message){
        clearInterval(interval);
        document.getElementById("notice").style.visibility = "visible";
        document.getElementById("notice").innerText = message;
    }
}



let boardLayout = [
    [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
    [-1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2,-1],
    [-1,1,1,-1,-1,-1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,-1,-1,-1,1,1,-1],
    [-1,1,1,-1,0,-1,1,1,1,1,-1,-1,-1,-1,1,1,1,1,1,-1,-1,-1,-1,1,1,1,1,-1,0,-1,1,1,-1],
    [-1,1,1,-1,-1,-1,1,1,1,1,-1,1,1,1,1,1,1,1,1,1,1,1,-1,1,1,1,1,-1,-1,-1,1,1,-1],
    [-1,1,1,1,1,1,1,1,2,1,-1,1,1,-1,-1,-1,-1,-1,-1,-1,1,1,-1,1,1,1,1,1,1,1,1,1,-1],
    [-1,1,1,1,-1,1,1,1,1,1,1,1,1,-1,0,0,0,0,0,-1,1,1,1,1,1,2,1,1,-1,1,1,1,-1],
    [-1,1,1,1,-1,1,1,1,1,1,1,1,1,-1,0,0,0,0,0,-1,1,1,1,1,1,1,1,1,-1,1,1,1,-1],
    [-1,1,1,1,-1,2,1,1,1,1,-1,1,1,-1,-1,-1,-1,-1,-1,-1,1,1,-1,1,1,1,1,1,-1,1,1,1,-1],
    [-1,1,1,1,-1,1,1,1,1,1,-1,1,1,1,1,1,1,1,1,1,1,1,-1,1,2,1,1,1,-1,1,1,1,-1],
    [-1,1,1,1,-1,1,1,1,1,1,-1,-1,-1,-1,1,1,1,1,1,-1,-1,-1,-1,1,1,1,1,1,-1,1,1,1,-1],
    [-1,1,1,1,-1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,-1,1,1,1,-1],
    [-1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,2,-1],
    [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1]];

//wall,food,boost,player,empty,opponent 6,15
let pac = new PackMan(boardLayout,3.029,[2,11],[-1,1,2,7,0,6],[6,15],[[5,17],[5,16],[5,15]]);
pac.pushOpponent([1,1]);
pac.pushOpponent([5,21]);
