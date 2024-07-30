### Documentation

**Overview**:
The `getAllFiles` function retrieves a list of files and/or directories within a specified directory. It can optionally return only directories if specified. The function uses a stack-based approach to traverse the directory structure.

**Parameters**:
- `directory` (string): The directory path to read.
- `foldersOnly` (boolean) [default=false]: If set to `true`, only directories will be included in the result. If `false`, both files and directories will be included.

**Returns**:
- `string[]`: A list of file or directory paths.

**Examples**:
```javascript
import getAllFiles from './path/to/getAllFiles';

// Get all files and directories in the 'src' directory
const allFiles = getAllFiles('./src');
console.log(allFiles);

// Get only directories in the 'src' directory
const directoriesOnly = getAllFiles('./src', true);
console.log(directoriesOnly);
```

**Notes**:
- **Recursive Traversal**: The function uses a stack to handle recursive traversal of directories, allowing it to handle deeply nested structures.
- **Edge Cases**:
  - If the specified directory does not exist, the function will throw an error.
  - Symlinks are not specifically handled; they will be processed like regular files or directories.
- **Performance**: This function reads all items in the specified directory synchronously, which may block the event loop for large directories. Consider using an asynchronous version for large-scale applications.