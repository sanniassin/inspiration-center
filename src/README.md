Примеры конфигураций всех сущностей

Демо доски `demo-boards.yml`
-
Это список всех демо досок, которые учавствуют в поиске с тегами, при помощи которых этот поиск и будет осуществляться.
```
# Agile processes Demo
- id: o9J_k0ivzog=
  tags:
  - agile
  
# Lean UX Workshop Demo
- id: o9J_k0ivyus=
  tags:
  - ux
  - workshop
```

Видео `videos.yml`
-
Это список всех видео, которые будут учавствовать в поиске в виде url. Пока поддерживаются только видео, которое хостится на YouTube и Vimeo.
Поиск будет осуществляться по напименованиям и описанию, которые будут подгружены в процессе сборки конфигурации.
```
# Customer Journey Mapping
- https://vimeo.com/106236408
# The Task Board    
- https://www.youtube.com/watch?v=Ti2g66b7MUo
```

GIF-файлы `how-to.yml`
-
В поле id здесь нужно указать произвольную строку, возможно, связанную по смыслу с самим gif-файлом, как в примере. Значение этого поля должно быть уникальным, в рамках этого файла. Это значение будет использоваться как ссылка при заполнении раздела Getting Started.
```
- id: multiple-objects
  title: Select and move multiple objects
  file: gif/multiple-objects.gif
  preview: gif/multiple-objects.png
  description: To select multiple objects, hold down Shift and drag the selection field across the objects or click them one by one. The selected objects can be moved, resized, locked, grouped, and aligned together.
  tags:
    - multiple
    - objects
```

PDF-файлы `guides.yml`
-
В поле id здесь нужно указать произвольную строку, возможно, связанную по смыслу с самим pdf-файлом, как в примере. Значение этого поля должно быть уникальным, в рамках этого файла. Это значение будет использоваться как ссылка при заполнении раздела Getting Started.
```
- id: main-guide
  title: Main guide
  file: pdf/main-guide.pdf
  preview: pdf/main-guide.png
  tags:
    - some
    - pdf
```

Модальные окна приложения `modal-forms.yml`
-
В поле id здесь указывается id модального окна из клиентой части приложения. Список всех окон перечислен в файле `ModalNames.ts`. На момент написания этой документации конфиге задействованы следующие модальные формы:
- SHORTCUTS - Shortcuts из окна Help & Feedback
- TIPS - Interface Explained из окна Help & Feedback
```
- id: SHORTCUTS
  title: Shortcuts
  preview: img/shortcuts.png
  tags:
    - shortcuts
- id: TIPS
  title: Interface Explained
  preview: img/interface-explained.png
  tags:
      - interface
      - explained
```

Туториалы `tutorials.yml`
-
В поле id здесь укаызвается id туториала из клиентской части приложения. Список всех туториалов перечислен в файле `StaticTutorialType.ts`. На момент написания этой документации конфиге задействованы следующий туториал:
- FULL - Тот который запускается из help menu
```
- title: Tutorial
  id: FULL
  preview: img/tutorial.png
  tags:
    - tutorial
    - full
```

Примечание
-
- Примеры заполнения разделов Use Cases и Getting Started, находятся в соответствующих папках.
- Все отступы от начала строки (в пробелах) имеют значение.
- Знаком # указываются комментарии. Эти строки не обязательны и не влияют на готовую конфигурацию.
- В поиске будут учавстовать все публичные шаблоны. Поиск будет осуществляться по названию и описанию шаблона, а также по названию категории, в которую они входят.
- Поиск по блогу и базе знаний будет осуществляться стандартным способом через открытое API.
- Все ссылки на контент, который хостится в этом репозитории должны быть указаны относительно папки `/content`
  Это относится, например, к картинкам для use case и getting started, GIF-файлам для раздела how-to, PDF-файлам для guides)
