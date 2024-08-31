const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const logger = require('./logger');
const baseDirs = ['authors', 'resources'];

const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>XIV Resource Registry</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #121212;
            color: #e0e0e0;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #ffffff;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            color: #ffffff;
        }
        .github-link {
            color: #42a5f5;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            padding-bottom: 2px;
            margin-left: 10px;
            transition: color 0.3s ease, border-color 0.3s ease;
        }
        .github-link svg {
            margin-right: 8px;
        }
        .github-link:hover {
            color: #ffffff;
        }
        h2 {
            margin-top: 30px;
        }
        h3 {
            color: #b3e5fc;
            text-decoration: none;
        }
        h3 a {
            color: inherit;
            text-decoration: inherit;
        }
        h3 a:hover {
            text-decoration: underline;
        }
        .category {
            margin-bottom: 40px;
        }
        .file-list {
            margin-left: 20px;
            display: block;
        }
        .yaml-container {
            background-color: #1e1e1e;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
            margin-bottom: 20px;
        }
        .yaml-container pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            color: #c3e88d;
        }
        .yaml-container code {
            display: block;
            background-color: #2b2b2b;
            padding: 10px;
            border-radius: 5px;
            font-family: 'Courier New', Courier, monospace;
            overflow-x: auto;
        }
        .blurb {
            margin-bottom: 40px;
            font-size: 1.1em;
            line-height: 1.6em;
        }
        #search {
            width: 100%;
            max-width: 500px;
            padding: 10px;
            margin-bottom: 20px;
            font-size: 1.1em;
            border-radius: 5px;
            border: 1px solid #333;
            background-color: #1e1e1e;
            color: #e0e0e0;
            box-sizing: border-box;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>XIV Resource Registry</h1>
        <a href="https://github.com/kalilistic/xiv-resource-registry" target="_blank" class="github-link">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.13 0 0 .67-.22 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.11.16 1.93.08 2.13.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>
            Contribute on GitHub
        </a>
    </div>
    <div class="blurb">
        The xiv-resource-registry is a community-driven initiative designed to store and manage metadata for FFXIV-related software projects. 
        This registry encompasses a wide range of projects, including plugins, overlays, websites, Discord servers, and more. By adhering to a standard specification, 
        contributors can ensure their projects are easily discoverable and accessible.
    </div>
    <input type="text" id="search" placeholder="Search resources..." />
    <div id="content"></div>
    <script>
        const yamlData = __YAML_DATA__;
        const contentDiv = document.getElementById('content');
        const searchInput = document.getElementById('search');

        const categories = {
            'resources/act/overlays': 'ACT Overlays',
            'resources/act/plugins': 'ACT Plugins',
            'resources/dalamud/plugins': 'Dalamud Plugins',
            'resources/dalamud/repos': 'Dalamud Repos',
            'resources/desktop': 'Desktop Applications',
            'resources/dev-tools': 'Development Tools',
            'resources/frameworks': 'Frameworks',
            'resources/web': 'Websites & Services',
            'authors': 'Authors'
        };

        const groupedData = yamlData.reduce((acc, { fileName, data }) => {
            for (const [pathPrefix, category] of Object.entries(categories)) {
                if (fileName.startsWith(pathPrefix)) {
                    if (!acc[category]) {
                        acc[category] = [];
                    }
                    acc[category].push({ fileName: fileName.replace(pathPrefix + '/', ''), filePath: fileName, data });
                    break;
                }
            }
            return acc;
        }, {});

        // Render all non-Authors categories first
        for (const [category, files] of Object.entries(groupedData)) {
            if (category !== 'Authors') {
                const categoryDiv = document.createElement('div');
                categoryDiv.classList.add('category');

                const categoryTitle = document.createElement('h2');
                categoryTitle.textContent = category;
                categoryDiv.appendChild(categoryTitle);

                const fileList = document.createElement('div');
                fileList.classList.add('file-list');
                files.forEach(({ fileName, filePath, data }) => {
                    const fileContainer = document.createElement('div');
                    fileContainer.classList.add('yaml-container');

                    const fileTitle = document.createElement('h3');
                    const titleLink = document.createElement('a');
                    titleLink.href = \`https://github.com/kalilistic/xiv-resource-registry/blob/master/\${filePath}\`;
                    titleLink.textContent = fileName;
                    fileTitle.appendChild(titleLink);
                    fileContainer.appendChild(fileTitle);

                    const preElement = document.createElement('pre');
                    const codeElement = document.createElement('code');
                    codeElement.textContent = data;
                    preElement.appendChild(codeElement);
                    fileContainer.appendChild(preElement);

                    fileList.appendChild(fileContainer);
                });

                categoryDiv.appendChild(fileList);
                contentDiv.appendChild(categoryDiv);
            }
        }

        // Render the Authors category last
        if (groupedData['Authors']) {
            const categoryDiv = document.createElement('div');
            categoryDiv.classList.add('category');

            const categoryTitle = document.createElement('h2');
            categoryTitle.textContent = 'Authors';
            categoryDiv.appendChild(categoryTitle);

            const fileList = document.createElement('div');
            fileList.classList.add('file-list');
            groupedData['Authors'].forEach(({ fileName, filePath, data }) => {
                const fileContainer = document.createElement('div');
                fileContainer.classList.add('yaml-container');

                const fileTitle = document.createElement('h3');
                const titleLink = document.createElement('a');
                titleLink.href = \`https://github.com/kalilistic/xiv-resource-registry/master/\${filePath}\`;
                titleLink.textContent = fileName;
                fileTitle.appendChild(titleLink);
                fileContainer.appendChild(fileTitle);

                const preElement = document.createElement('pre');
                const codeElement = document.createElement('code');
                codeElement.textContent = data;
                preElement.appendChild(codeElement);
                fileContainer.appendChild(preElement);

                fileList.appendChild(fileContainer);
            });

            categoryDiv.appendChild(fileList);
            contentDiv.appendChild(categoryDiv);
        }

        // Enhanced search functionality
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            document.querySelectorAll('.yaml-container').forEach(container => {
                const fileName = container.querySelector('h3').textContent.toLowerCase();
                const fileContent = container.querySelector('pre code').textContent.toLowerCase();
                container.style.display = fileName.includes(searchTerm) || fileContent.includes(searchTerm) ? '' : 'none';
            });
        });
    </script>
</body>
</html>
`;

/**
 * Walks a directory and returns a list of YAML files.
 * @param dir
 * @param fileList
 * @returns {*[]}
 */
function walkDir(dir, fileList = []) {
    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            walkDir(filePath, fileList);
        } else if (file.endsWith('.yaml')) {
            fileList.push(filePath);
        }
    });
    return fileList;
}

/**
 * Generates the site by reading YAML files and generating an HTML file.
 */
function generateSite() {
    const yamlFiles = baseDirs.flatMap(dir => walkDir(dir));
    logger.info(`Found ${yamlFiles.length} YAML files.`);

    const yamlData = yamlFiles.map(filePath => {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            return { fileName: path.relative('.', filePath), data: fileContent };
        } catch (error) {
            logger.error(`Failed to process file ${filePath}: ${error.message}`);
            return null;
        }
    }).filter(Boolean);

    const htmlContent = htmlTemplate.replace('__YAML_DATA__', JSON.stringify(yamlData));
    fs.writeFileSync('index.html', htmlContent);
    logger.info('Generated index.html');
}

generateSite();
