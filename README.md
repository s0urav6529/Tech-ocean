# Git Setting

### Check git installed or not

    git --version

### initialize git

    sudo apt install git

### 🔧 Configure git

    git config --global user.name <your-name>
    git config --global user.email <your-email>

### Show the global configuration

    git config --list

### Create ssh key for GitHub & system connection or check the 🔗

    ssh-keygen -t rsa -b 4096 -C "abc@gmail.com"

Then go to the file location & copy the key form the .pub file. After copy it paste it in ssh key of the github or gitlab setting. Then run the cmd for ensuring key connected successfully.

    ssh -T git@github.com

### For more details watch this 🔗

    https://www.youtube.com/watch?v=jfi9n4y-WFo&t=205s

### SSH 🔑 set or not set checked-out

    ls -al  ~/.ssh

### clone a git repository

For cloning a git repositoty need to copy the ssh/https 🔗 for the repositoty.

    git@github.com:xcompany/x-Managment.git [ssh]
    https://github.com/xcompany/x-Managment.git.git [https]

After copy that 🔗, go to the os terminal create a directory or directly clone the 🔗.

    :git clone <git@github.com:xcompany/repo_name.git>

Then go to the directory

    : cd x-Managment
    : code .

### clone a branch of a repository

    : git clone -b <branch_name> git@gitlab.com:sourav.majumder/repo_name.git

# Git Command

### Stages changes in the all files for the next commit.

    git add .

### Check status of your working directory, showing changes that are staged or unstaged.

    git status

### Records the staged changes as a new commit along with a descriptive message.

    git commit -m "<message>" (-m means message)

### Uploads local commits to a remote repository.

    git push -u origin <branch_name>

### Create a new branch & switch to the branch.

    git checkout -b <branch_name>


### Switch to a existed branch after commit in current branch

    git switch <branch_name>
    git checkout <branch-name>

### To check the current branch you are on in a Git repository using the command line.

    git branch

Then git will display a list of all the branches in your repository. The currently checked-out branch will be highlighted with an asterisk (\*).
For example, if you see output like this:

    main
    *feature-branch

It means that you are currently on the "feature-branch" because it has the asterisk next to it.

### Only want to see the current branch.

    git rev-parse --abbrev-ref HEAD


### Fetches changes from a remote repository and merges them into the current branch.

    git pull origin <branch_name>

### Rename branch name.

    git branch -m <old_branch_name> <new_branch_name>

### Delete a branch.

At first switch to other branch(not delete branch) then delete the branch you want to delete.

    git branch -d <branch-name>

### Delete the .git Directory:

If you want to remove Git version control from a project, you essentially need to delete the hidden .git directory in the root of your project. This will remove all Git-related history, configuration, and tracking from the project.

    rm -rf .git

### Remove an existed git repositoy & add a new repository to the project

    git remote remove origin

    git remote add origin <origin_name>  or
    git remote set-url origin <origin_name>

check the origin

    git remote -v
    git branch
    git push -u origin <branch_name>  or
    git push -f origin <brach_name>

### To clear the cache and update the ignored files :

syntex :

    git rm --cached <file name>

example :

    git rm --cached .env
    git rm --cached serviceAccountKey.json
    git rm -r --cached __pycache__

    git commit -m "Update .gitignore to exclude serviceAccountKey.json"

    git push -u origin <branch_name>


### Connect newly created git repositoty to local existed project

    git init
    git status      #optional
    git add .
    git commit -m "first commit"
    git remote add origin <repo_name>
    git push -u origin master                   #by default master

if want to change branch before add files, need to follow this
    
    git init
    git status    #optional
    git remote add origin <repo_name>
    git checkout -b <branch_name>       #your desired branch
    git add .
    git commit -m "first commit"
    git push -u origin <branch_name>