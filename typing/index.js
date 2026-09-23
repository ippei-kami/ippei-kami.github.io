var samples = []
var clear = 0

var inputting = false
var start = undefined
var time = 0

var word = ''

async function getList() {
  const response = await fetch('./list.txt')
  try {
    if (response.ok) {
      const text = await response.text()
      samples = text.split('\n').map(s => s.trim()).filter(s => s !== '')
      getSample()
    }
    else {
      document.querySelector('#sample').textContent = '問題リストの読み込みに失敗しました'
    }
  }
  catch (err) {
    document.querySelector('#sample').textContent = '問題リストの読み込みに失敗しました'
  }
}

document.querySelector('#enter').onclick = () => {
  if (document.querySelector('#input').value == word) {
    getSample()
    clear += 1
    inputting = false
    time += (Date.now() - start) / 1000
    document.querySelector('#input').value = ''
    document.querySelector('#result').textContent = 'OK!'
    document.querySelector('#result2').textContent = `${clear}問クリアしました。 ${time.toFixed(2)}秒かかりました。`

  }
  else {
    Array.from(word).forEach((char, index) => {
      if (char != document.querySelector('#input').value[index]) {
        document.querySelector('#sample').children[index].style.color = 'red'
      }
      else {
        document.querySelector('#sample').children[index].style.color = 'black'
      }
    });
    document.querySelector('#result').textContent = '入力が違います。確認してください。'
  }
}

document.querySelector('#input').oninput = () => {
  document.querySelector('#result').textContent = '　'
  if (!inputting) {
    start = Date.now()
    inputting = true
  }
}

function getSample() {
  word = samples[Math.floor(Math.random() * samples.length)]
  document.querySelector('#sample').innerHTML = ''
  for (const char of word) {
    document.querySelector('#sample').innerHTML += `<span>${char}</span>`
  }
}

getList()
