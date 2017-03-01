Пример конфигурирования категорий Getting Started
=

Cоздаем файл с названием категории, например, example.yml.

Содержимое файла
-
```
title: Board Basics
description: Get familiar with whiteboard tools and pick up some advanced tips.
image: img/board-basics.svg
order: 1
howTo:
  - multiple-objects
guides:
  - inspiration-center
modalForms:
  - SHORTCUTS
  - TIPS
tutorials:
  - FULL
videos:
  - https://www.youtube.com/watch?v=Pa_W0zW0M4Y
helpTopics:
  - title: Achieve goals with distributed agile teams
    url: https://help.realtimeboard.com/solution/articles/11000008278-achieve-goals-with-distributed-agile-teams
```

Примечание
- все отступы от начала строки (в пробелах) имеют значение.
- order - отвечает за порядок отображения категории на клиенте. Сортировка производится по возрастанию.
- image - название файла с иконкой, которая будет отображаться для этого раздела inspiration-center. 
  Путь до иконки указывается относительно папки `/content`.
- howTo, guides, modalForms, tutorials - ссылки на id-аттрибуты элементов соответствующих списков, расположенных в родительской директории.
- videos - ссылки на видео контент. Пока поддерживаются только видео с Youtube и Vimeo.
- helpTopics - список статей из базы знаний. Каждый элемент списка состоит из заголовка `title` и ссылки `url`.
- символы `#` используются в качестве комментариев, для удобства и не влияют на конечную конфигурацию.
